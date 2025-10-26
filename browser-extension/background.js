// WatSearch Browser Extension - Background Script
// Handles communication between content scripts and WatSearch application

class WatSearchBackground {
  constructor() {
    this.watSearchUrl = "http://localhost:3000"; // Default WatSearch URL
    this.setupMessageHandlers();
    this.setupStorage();
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log("WatSearch Background: Received message:", request);

      switch (request.type) {
        case "COURSE_DATA":
          this.handleCourseData(request.data, sendResponse);
          break;
        case "GET_WATSEARCH_URL":
          sendResponse({ url: this.watSearchUrl });
          break;
        case "SET_WATSEARCH_URL":
          this.setWatSearchUrl(request.url);
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ error: "Unknown message type" });
      }

      return true; // Keep message channel open for async response
    });
  }

  setupStorage() {
    // Load saved WatSearch URL
    chrome.storage.local.get(["watSearchUrl"], (result) => {
      if (result.watSearchUrl) {
        this.watSearchUrl = result.watSearchUrl;
      }
    });
  }

  setWatSearchUrl(url) {
    this.watSearchUrl = url;
    chrome.storage.local.set({ watSearchUrl: url });
  }

  async handleCourseData(data, sendResponse) {
    try {
      console.log("WatSearch Background: Sending data to WatSearch:", data);

      // Try to send to WatSearch application
      const response = await this.sendToWatSearch(data);

      if (response.success) {
        console.log("WatSearch Background: Data sent successfully");
        sendResponse({
          success: true,
          message: "Data sent to WatSearch successfully",
        });
      } else {
        console.error(
          "WatSearch Background: Failed to send data:",
          response.error
        );
        sendResponse({ success: false, error: response.error });
      }
    } catch (error) {
      console.error("WatSearch Background: Error handling course data:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async sendToWatSearch(data) {
    try {
      const response = await fetch(`${this.watSearchUrl}/api/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        "WatSearch Background: Failed to connect to WatSearch:",
        error
      );

      // Try alternative ports
      const alternativePorts = [3000, 3001, 3002];
      for (const port of alternativePorts) {
        try {
          const altUrl = `http://localhost:${port}`;
          const response = await fetch(`${altUrl}/api/courses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            this.setWatSearchUrl(altUrl);
            return await response.json();
          }
        } catch (altError) {
          console.log(`WatSearch Background: Port ${port} not available`);
        }
      }

      throw error;
    }
  }
}

// Initialize background script
new WatSearchBackground();
