// WatSearch Browser Extension - Background Script
// Handles communication between content scripts and WatSearch application

class WatSearchBackground {
  constructor() {
    this.watSearchUrl = "http://localhost:3000"; // Default WatSearch URL
    this.isProcessing = false;
    this.currentProcessingTabs = []; // Track tabs being processed
    this.shouldCancel = false;
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
        case "EXTRACT_OUTLINE_URLS":
          // Forward to content script
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, { type: "EXTRACT_URLS" }, (response) => {
                sendResponse(response);
              });
            } else {
              sendResponse({ error: "No active tab" });
            }
          });
          return true; // Keep channel open
        case "BATCH_DOWNLOAD_OUTLINES":
          this.handleBatchDownload(request.urls, request.selectedTerms, sendResponse);
          return true; // Keep channel open for async processing
        case "CANCEL_PROCESSING":
          this.cancelProcessing(sendResponse);
          return true;
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

  cancelProcessing(sendResponse) {
    console.log("WatSearch Background: Cancelling processing...");
    this.shouldCancel = true;
    
    // Close all tabs that are currently being processed
    this.currentProcessingTabs.forEach(tabId => {
      if (tabId) {
        try {
          chrome.tabs.remove(tabId);
        } catch (e) {
          console.error("Failed to close tab:", e);
        }
      }
    });
    
    this.currentProcessingTabs = [];
    this.isProcessing = false;
    
    chrome.runtime.sendMessage({
      type: "PROCESSING_CANCELLED",
      message: "Processing cancelled",
    });
    
    sendResponse({ success: true, message: "Processing cancelled" });
  }

  async handleBatchDownload(urls, selectedTerms, sendResponse) {
    try {
      console.log("WatSearch Background: Starting batch processing");
      
      // Reset cancel flag and processing state
      this.shouldCancel = false;
      this.isProcessing = true;
      this.currentProcessingTabs = [];
      
      if (!urls || (Array.isArray(urls) && urls.length === 0) || (typeof urls === 'object' && !urls.coursesByTerm && !urls.urls)) {
        this.isProcessing = false;
        sendResponse({
          success: false,
          error: "No URLs provided",
        });
        return;
      }

      // Filter URLs by selected terms if provided
      let urlsToProcess = [];
      if (selectedTerms && selectedTerms.length > 0 && typeof urls === 'object' && urls.coursesByTerm) {
        // Filter by selected terms
        selectedTerms.forEach(term => {
          if (urls.coursesByTerm[term]) {
            urlsToProcess.push(...urls.coursesByTerm[term]);
          }
        });
      } else if (Array.isArray(urls)) {
        // If urls is just an array, use all of them
        urlsToProcess = urls;
      } else if (typeof urls === 'object' && urls.coursesByTerm) {
        // If no terms selected but we have coursesByTerm, use all
        Object.values(urls.coursesByTerm).forEach(termUrls => {
          urlsToProcess.push(...termUrls);
        });
      } else {
        // Fallback: try to use urls.urls if it exists
        urlsToProcess = urls.urls || [];
      }

      if (urlsToProcess.length === 0) {
        sendResponse({
          success: false,
          error: "No courses found for selected terms",
        });
        return;
      }

      // Send initial response immediately (processing will continue in background)
      sendResponse({
        success: true,
        message: `Starting processing of ${urlsToProcess.length} course outlines...`,
        started: true,
      });

      const results = [];
      let completedCount = 0;
      let successCount = 0;
      let failCount = 0;

      // Process each URL sequentially to avoid overwhelming the browser
      for (let i = 0; i < urlsToProcess.length; i++) {
        // Check if cancellation was requested
        if (this.shouldCancel) {
          console.log("WatSearch Background: Processing cancelled by user");
          chrome.runtime.sendMessage({
            type: "DOWNLOAD_COMPLETE",
            success: false,
            cancelled: true,
            message: `Processing cancelled. Processed ${successCount} out of ${urlsToProcess.length} courses before cancellation.`,
            successCount,
            failCount,
            results: results,
          });
          break;
        }

        const url = urlsToProcess[i];
        let tab = null;
        
        try {
          // Send progress update
          chrome.runtime.sendMessage({
            type: "DOWNLOAD_PROGRESS",
            current: i + 1,
            total: urlsToProcess.length,
            success: successCount,
            failed: failCount,
            currentUrl: url,
          });

          // Open tab in background
          tab = await chrome.tabs.create({
            url: url,
            active: false,
          });
          
          // Track this tab for potential cancellation
          this.currentProcessingTabs.push(tab.id);

          // Check for cancellation before processing
          if (this.shouldCancel) {
            if (tab && tab.id) {
              chrome.tabs.remove(tab.id);
              this.currentProcessingTabs = this.currentProcessingTabs.filter(id => id !== tab.id);
            }
            break;
          }

          // Wait for page to load completely
          await this.waitForTabLoad(tab.id);

          // Check for cancellation again
          if (this.shouldCancel) {
            if (tab && tab.id) {
              chrome.tabs.remove(tab.id);
              this.currentProcessingTabs = this.currentProcessingTabs.filter(id => id !== tab.id);
            }
            break;
          }

          // Ensure content script is injected and ready
          await this.waitForContentScript(tab.id);

          // Check for cancellation again
          if (this.shouldCancel) {
            if (tab && tab.id) {
              chrome.tabs.remove(tab.id);
              this.currentProcessingTabs = this.currentProcessingTabs.filter(id => id !== tab.id);
            }
            break;
          }

          // Extract HTML from the page
          const htmlResponse = await chrome.tabs.sendMessage(tab.id, {
            type: "EXTRACT_HTML",
          });

          if (!htmlResponse || !htmlResponse.success || !htmlResponse.html) {
            throw new Error("Failed to extract HTML from page");
          }

          // Send HTML to WatSearch API
          const apiResponse = await this.sendOutlineToWatSearch(htmlResponse.html);

          if (apiResponse && apiResponse.success) {
            results.push({ url, success: true, course: apiResponse.course });
            successCount++;
          } else {
            throw new Error(apiResponse?.error || "API request failed");
          }

          completedCount++;

          // Send progress update
          chrome.runtime.sendMessage({
            type: "DOWNLOAD_PROGRESS",
            current: completedCount,
            total: urlsToProcess.length,
            success: successCount,
            failed: failCount,
          });

          // Add delay between requests to avoid overwhelming the server
          if (i < urlsToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
        } catch (error) {
          console.error(`WatSearch Background: Failed to process ${url}:`, error);
          results.push({ url, success: false, error: error.message });
          failCount++;
          completedCount++;

          // Send progress update
          chrome.runtime.sendMessage({
            type: "DOWNLOAD_PROGRESS",
            current: completedCount,
            total: urlsToProcess.length,
            success: successCount,
            failed: failCount,
          });
        } finally {
          // Always close the tab, even if there was an error
          if (tab && tab.id) {
            try {
              chrome.tabs.remove(tab.id);
              this.currentProcessingTabs = this.currentProcessingTabs.filter(id => id !== tab.id);
            } catch (e) {
              console.error("Failed to close tab:", e);
            }
          }
        }

        // Check if all processing completed (and not cancelled)
        if (completedCount === urlsToProcess.length && !this.shouldCancel) {
          chrome.runtime.sendMessage({
            type: "DOWNLOAD_COMPLETE",
            success: true,
            message: `Processed ${successCount} out of ${urlsToProcess.length} course outlines successfully!`,
            successCount,
            failCount,
            results: results,
          });
          break; // Exit the loop
        }
      }
      
      // Reset processing state
      this.isProcessing = false;
      this.currentProcessingTabs = [];
    } catch (error) {
      console.error("WatSearch Background: Error in batch processing:", error);
      this.isProcessing = false;
      this.currentProcessingTabs = [];
      
      // Close any remaining tabs
      this.currentProcessingTabs.forEach(tabId => {
        if (tabId) {
          try {
            chrome.tabs.remove(tabId);
          } catch (e) {
            console.error("Failed to close tab:", e);
          }
        }
      });
      this.currentProcessingTabs = [];
      
      chrome.runtime.sendMessage({
        type: "DOWNLOAD_COMPLETE",
        success: false,
        error: error.message,
      });
    }
  }

  async waitForTabLoad(tabId, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkComplete = () => {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (tab.status === "complete") {
            // Wait a bit more for JavaScript to render
            setTimeout(() => {
              resolve();
            }, 2000); // 2 second wait for JS rendering
          } else if (Date.now() - startTime > timeout) {
            reject(new Error("Timeout waiting for page to load"));
          } else {
            setTimeout(checkComplete, 500);
          }
        });
      };

      checkComplete();
    });
  }

  async waitForContentScript(tabId, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkScript = () => {
        // Try to send a ping message to see if content script is ready
        chrome.tabs.sendMessage(tabId, { type: "PING" }, (response) => {
          if (chrome.runtime.lastError) {
            if (Date.now() - startTime > timeout) {
              reject(new Error("Timeout waiting for content script"));
            } else {
              setTimeout(checkScript, 500);
            }
          } else {
            resolve();
          }
        });
      };

      checkScript();
    });
  }

  async sendOutlineToWatSearch(html) {
    try {
      // Convert HTML to a File-like object for FormData
      const blob = new Blob([html], { type: 'text/html' });
      const formData = new FormData();
      formData.append('file', blob, 'course-outline.html');

      // Send to WatSearch API
      const response = await fetch(`${this.watSearchUrl}/api/upload-outline`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("WatSearch Background: Failed to send outline to API:", error);
      throw error;
    }
  }
}

// Initialize background script
new WatSearchBackground();
