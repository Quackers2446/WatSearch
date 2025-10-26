// WatSearch Browser Extension - Popup Script

class WatSearchPopup {
  constructor() {
    this.currentTab = null;
    this.currentSite = null;
    this.extractedData = null;
    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
    this.detectCurrentSite();
  }

  initializeElements() {
    this.statusEl = document.getElementById("status");
    this.siteInfoEl = document.getElementById("siteInfo");
    this.currentSiteEl = document.getElementById("currentSite");
    this.siteDescriptionEl = document.getElementById("siteDescription");
    this.extractBtn = document.getElementById("extractBtn");
    this.sendBtn = document.getElementById("sendBtn");
    this.watSearchUrlInput = document.getElementById("watSearchUrl");
    this.testConnectionBtn = document.getElementById("testConnection");
    this.loadingEl = document.getElementById("loading");
  }

  setupEventListeners() {
    this.extractBtn.addEventListener("click", () => this.extractData());
    this.sendBtn.addEventListener("click", () => this.sendToWatSearch());
    this.testConnectionBtn.addEventListener("click", () =>
      this.testConnection()
    );
    this.watSearchUrlInput.addEventListener("change", () =>
      this.saveSettings()
    );
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(["watSearchUrl"]);
      if (result.watSearchUrl) {
        this.watSearchUrlInput.value = result.watSearchUrl;
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  saveSettings() {
    const url = this.watSearchUrlInput.value;
    chrome.storage.local.set({ watSearchUrl: url });
  }

  async detectCurrentSite() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      this.currentTab = tab;

      const hostname = new URL(tab.url).hostname;
      if (hostname.includes("learn.uwaterloo.ca")) {
        this.currentSite = "LEARN";
        this.showSiteInfo("LEARN", "University of Waterloo LEARN platform");
      } else if (hostname.includes("quest.uwaterloo.ca")) {
        this.currentSite = "Quest";
        this.showSiteInfo(
          "Quest",
          "University of Waterloo Quest student information system"
        );
      } else if (hostname.includes("piazza.com")) {
        this.currentSite = "Piazza";
        this.showSiteInfo("Piazza", "Piazza discussion platform");
      } else {
        this.currentSite = null;
        this.hideSiteInfo();
      }
    } catch (error) {
      console.error("Error detecting current site:", error);
    }
  }

  showSiteInfo(site, description) {
    this.currentSiteEl.textContent = `Current Site: ${site}`;
    this.siteDescriptionEl.textContent = description;
    this.siteInfoEl.style.display = "block";
    this.updateStatus(`Ready to extract data from ${site}`, "success");
  }

  hideSiteInfo() {
    this.siteInfoEl.style.display = "none";
    this.updateStatus(
      "Navigate to LEARN, Quest, or Piazza to extract course information",
      "info"
    );
  }

  updateStatus(message, type = "info") {
    this.statusEl.innerHTML = `<strong>${message}</strong>`;
    this.statusEl.className = `status ${type}`;
  }

  showLoading() {
    this.loadingEl.style.display = "block";
    this.extractBtn.disabled = true;
    this.sendBtn.disabled = true;
  }

  hideLoading() {
    this.loadingEl.style.display = "none";
    this.extractBtn.disabled = false;
    this.sendBtn.disabled = false;
  }

  async extractData() {
    if (!this.currentTab) {
      this.updateStatus("No active tab found", "error");
      return;
    }

    this.showLoading();
    this.updateStatus("Extracting course data...", "info");

    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: "EXTRACT_DATA",
      });

      if (response && response.success) {
        this.extractedData = response.data;
        this.updateStatus(
          `Data extracted successfully! Found ${this.getDataCount()} items`,
          "success"
        );
        this.sendBtn.disabled = false;
      } else {
        this.updateStatus(
          "Failed to extract data. Make sure you're on a supported site.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error extracting data:", error);
      this.updateStatus(
        "Error extracting data. Try refreshing the page.",
        "error"
      );
    } finally {
      this.hideLoading();
    }
  }

  getDataCount() {
    if (!this.extractedData || !this.extractedData.data) return 0;

    const data = this.extractedData.data;
    let count = 0;

    if (data.courses) count += data.courses.length;
    if (data.assignments) count += data.assignments.length;
    if (data.announcements) count += data.announcements.length;
    if (data.schedule) count += data.schedule.length;
    if (data.posts) count += data.posts.length;

    return count;
  }

  async sendToWatSearch() {
    if (!this.extractedData) {
      this.updateStatus("No data to send. Extract data first.", "error");
      return;
    }

    this.showLoading();
    this.updateStatus("Sending data to WatSearch...", "info");

    try {
      const response = await chrome.runtime.sendMessage({
        type: "COURSE_DATA",
        data: this.extractedData,
      });

      if (response && response.success) {
        this.updateStatus("Data sent to WatSearch successfully!", "success");
        this.extractedData = null; // Clear data after sending
        this.sendBtn.disabled = true;
      } else {
        this.updateStatus(
          `Failed to send data: ${response?.error || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error sending data:", error);
      this.updateStatus(
        "Error sending data. Make sure WatSearch is running.",
        "error"
      );
    } finally {
      this.hideLoading();
    }
  }

  async testConnection() {
    const url = this.watSearchUrlInput.value;
    if (!url) {
      this.updateStatus("Please enter a WatSearch URL", "error");
      return;
    }

    this.showLoading();
    this.updateStatus("Testing connection...", "info");

    try {
      const response = await fetch(`${url}/api/health`, {
        method: "GET",
        mode: "no-cors",
      });

      // Since we can't read the response due to CORS, we'll assume success if no error
      this.updateStatus("Connection test successful!", "success");
    } catch (error) {
      console.error("Connection test failed:", error);
      this.updateStatus(
        "Connection test failed. Check if WatSearch is running.",
        "error"
      );
    } finally {
      this.hideLoading();
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new WatSearchPopup();
});
