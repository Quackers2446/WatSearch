// WatSearch Browser Extension - Popup Script

class WatSearchPopup {
    constructor() {
        this.currentTab = null
        this.currentSite = null
        this.extractedData = null
        this.availableTerms = []
        this.coursesByTerm = {}
        this.initializeElements()
        this.setupEventListeners()
        this.loadSettings()
        this.detectCurrentSite()
    }

    initializeElements() {
        this.statusEl = document.getElementById("status")
        this.siteInfoEl = document.getElementById("siteInfo")
        this.currentSiteEl = document.getElementById("currentSite")
        this.siteDescriptionEl = document.getElementById("siteDescription")
        this.extractBtn = document.getElementById("extractBtn")
        this.sendBtn = document.getElementById("sendBtn")
        this.downloadOutlinesBtn = document.getElementById(
            "downloadOutlinesBtn",
        )
        this.cancelProcessingBtn = document.getElementById(
            "cancelProcessingBtn",
        )
        this.outlineSection = document.getElementById("outlineSection")
        this.termCheckboxes = document.getElementById("termCheckboxes")
        this.watSearchUrlInput = document.getElementById("watSearchUrl")
        this.testConnectionBtn = document.getElementById("testConnection")
        this.loadingEl = document.getElementById("loading")
    }

    setupEventListeners() {
        this.extractBtn.addEventListener("click", () => this.extractData())
        this.sendBtn.addEventListener("click", () => this.sendToWatSearch())
        this.downloadOutlinesBtn.addEventListener("click", () =>
            this.downloadAllOutlines(),
        )
        this.cancelProcessingBtn.addEventListener("click", () =>
            this.cancelProcessing(),
        )
        this.testConnectionBtn.addEventListener("click", () =>
            this.testConnection(),
        )
        this.watSearchUrlInput.addEventListener("change", () =>
            this.saveSettings(),
        )
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(["watSearchUrl"])
            if (result.watSearchUrl) {
                this.watSearchUrlInput.value = result.watSearchUrl
            }
        } catch (error) {
            console.error("Error loading settings:", error)
        }
    }

    saveSettings() {
        const url = this.watSearchUrlInput.value
        chrome.storage.local.set({ watSearchUrl: url })
    }

    async detectCurrentSite() {
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            })
            this.currentTab = tab

            const hostname = new URL(tab.url).hostname
            if (hostname.includes("learn.uwaterloo.ca")) {
                this.currentSite = "LEARN"
                this.showSiteInfo(
                    "LEARN",
                    "University of Waterloo LEARN platform",
                )
            } else if (hostname.includes("quest.uwaterloo.ca")) {
                this.currentSite = "Quest"
                this.showSiteInfo(
                    "Quest",
                    "University of Waterloo Quest student information system",
                )
            } else if (hostname.includes("piazza.com")) {
                this.currentSite = "Piazza"
                this.showSiteInfo("Piazza", "Piazza discussion platform")
            } else if (hostname.includes("outline.uwaterloo.ca")) {
                this.currentSite = "Outline"
                this.showSiteInfo(
                    "Outline.uwaterloo.ca",
                    "Course outline viewer",
                )
                // Show outline section and load terms
                if (this.outlineSection) {
                    this.outlineSection.style.display = "block"
                }
                this.loadAvailableTerms()
            } else {
                this.currentSite = null
                this.hideSiteInfo()
                // Hide outline section
                if (this.outlineSection) {
                    this.outlineSection.style.display = "none"
                }
            }
        } catch (error) {
            console.error("Error detecting current site:", error)
        }
    }

    showSiteInfo(site, description) {
        this.currentSiteEl.textContent = `Current Site: ${site}`
        this.siteDescriptionEl.textContent = description
        this.siteInfoEl.style.display = "block"
        this.updateStatus(`Ready to extract data from ${site}`, "success")
    }

    hideSiteInfo() {
        this.siteInfoEl.style.display = "none"
        this.updateStatus(
            "Navigate to LEARN, Quest, or Piazza to extract course information",
            "info",
        )
    }

    updateStatus(message, type = "info") {
        this.statusEl.innerHTML = `<strong>${message}</strong>`
        this.statusEl.className = `status ${type}`
    }

    showLoading() {
        this.loadingEl.style.display = "block"
        this.extractBtn.disabled = true
        this.sendBtn.disabled = true
    }

    hideLoading() {
        this.loadingEl.style.display = "none"
        this.extractBtn.disabled = false
        this.sendBtn.disabled = false
    }

    showCancelButton() {
        if (this.cancelProcessingBtn) {
            this.cancelProcessingBtn.style.display = "block"
        }
        if (this.downloadOutlinesBtn) {
            this.downloadOutlinesBtn.disabled = true
        }
    }

    hideCancelButton() {
        if (this.cancelProcessingBtn) {
            this.cancelProcessingBtn.style.display = "none"
        }
        if (this.downloadOutlinesBtn) {
            this.downloadOutlinesBtn.disabled = false
        }
    }

    async cancelProcessing() {
        try {
            this.updateStatus("Cancelling processing...", "info")

            const response = await chrome.runtime.sendMessage({
                type: "CANCEL_PROCESSING",
            })

            if (response && response.success) {
                this.updateStatus("Processing cancelled", "info")
                this.hideCancelButton()
                this.hideLoading()
            }
        } catch (error) {
            console.error("Error cancelling processing:", error)
            this.updateStatus("Error cancelling processing", "error")
        }
    }

    async extractData() {
        if (!this.currentTab) {
            this.updateStatus("No active tab found", "error")
            return
        }

        this.showLoading()
        this.updateStatus("Extracting course data...", "info")

        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                type: "EXTRACT_DATA",
            })

            if (response && response.success) {
                this.extractedData = response.data
                this.updateStatus(
                    `Data extracted successfully! Found ${this.getDataCount()} items`,
                    "success",
                )
                this.sendBtn.disabled = false
            } else {
                this.updateStatus(
                    "Failed to extract data. Make sure you're on a supported site.",
                    "error",
                )
            }
        } catch (error) {
            console.error("Error extracting data:", error)
            this.updateStatus(
                "Error extracting data. Try refreshing the page.",
                "error",
            )
        } finally {
            this.hideLoading()
        }
    }

    getDataCount() {
        if (!this.extractedData || !this.extractedData.data) return 0

        const data = this.extractedData.data
        let count = 0

        if (data.courses) count += data.courses.length
        if (data.assignments) count += data.assignments.length
        if (data.announcements) count += data.announcements.length
        if (data.schedule) count += data.schedule.length
        if (data.posts) count += data.posts.length

        return count
    }

    async sendToWatSearch() {
        if (!this.extractedData) {
            this.updateStatus("No data to send. Extract data first.", "error")
            return
        }

        this.showLoading()
        this.updateStatus("Sending data to WatSearch...", "info")

        try {
            const response = await chrome.runtime.sendMessage({
                type: "COURSE_DATA",
                data: this.extractedData,
            })

            if (response && response.success) {
                this.updateStatus(
                    "Data sent to WatSearch successfully!",
                    "success",
                )
                this.extractedData = null // Clear data after sending
                this.sendBtn.disabled = true
            } else {
                this.updateStatus(
                    `Failed to send data: ${response?.error || "Unknown error"}`,
                    "error",
                )
            }
        } catch (error) {
            console.error("Error sending data:", error)
            this.updateStatus(
                "Error sending data. Make sure WatSearch is running.",
                "error",
            )
        } finally {
            this.hideLoading()
        }
    }

    async testConnection() {
        const url = this.watSearchUrlInput.value
        if (!url) {
            this.updateStatus("Please enter a WatSearch URL", "error")
            return
        }

        this.showLoading()
        this.updateStatus("Testing connection...", "info")

        try {
            const response = await fetch(`${url}/api/health`, {
                method: "GET",
                mode: "no-cors",
            })

            // Since we can't read the response due to CORS, we'll assume success if no error
            this.updateStatus("Connection test successful!", "success")
        } catch (error) {
            console.error("Connection test failed:", error)
            this.updateStatus(
                "Connection test failed. Check if WatSearch is running.",
                "error",
            )
        } finally {
            this.hideLoading()
        }
    }

    async loadAvailableTerms() {
        if (!this.currentTab) return

        try {
            const extractResponse = await chrome.runtime.sendMessage({
                type: "EXTRACT_OUTLINE_URLS",
            })

            if (
                extractResponse &&
                extractResponse.success &&
                extractResponse.coursesByTerm
            ) {
                this.coursesByTerm = extractResponse.coursesByTerm
                this.availableTerms = Object.keys(
                    extractResponse.coursesByTerm,
                ).sort((a, b) => {
                    // Sort terms - most recent first (Fall 2025, Spring 2025, Winter 2025, etc.)
                    // Extract year and season for sorting
                    const getTermOrder = (term) => {
                        const parts = term.split(" ")
                        const season = parts[0]
                        const year = parseInt(parts[1]) || 0
                        const seasonOrder = { Fall: 3, Winter: 2, Spring: 1 }
                        return year * 10 + (seasonOrder[season] || 0)
                    }
                    return getTermOrder(b) - getTermOrder(a) // Descending (newest first)
                })

                this.renderTermSelection()
            }
        } catch (error) {
            console.error("Error loading terms:", error)
        }
    }

    renderTermSelection() {
        if (!this.termCheckboxes) return

        this.termCheckboxes.innerHTML = ""

        if (this.availableTerms.length === 0) {
            this.termCheckboxes.innerHTML =
                '<div style="font-size: 11px; color: #666; padding: 8px;">No terms found. Make sure you\'re on the listings page.</div>'
            return
        }

        // Default to selecting the first (most recent) term
        const defaultSelected =
            this.availableTerms.length > 0 ? [this.availableTerms[0]] : []

        this.availableTerms.forEach((term, index) => {
            const isChecked = index === 0 // Default to first term
            const checkbox = document.createElement("label")
            checkbox.style.cssText =
                "display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; padding: 4px 0;"

            const input = document.createElement("input")
            input.type = "checkbox"
            input.value = term
            input.checked = isChecked
            input.style.cssText = "cursor: pointer;"

            const courseCount = this.coursesByTerm[term]?.length || 0
            const labelText = document.createTextNode(
                `${term} (${courseCount} courses)`,
            )

            checkbox.appendChild(input)
            checkbox.appendChild(labelText)
            this.termCheckboxes.appendChild(checkbox)
        })
    }

    getSelectedTerms() {
        const checkboxes = this.termCheckboxes.querySelectorAll(
            'input[type="checkbox"]:checked',
        )
        return Array.from(checkboxes).map((cb) => cb.value)
    }

    async downloadAllOutlines() {
        if (!this.currentTab) {
            this.updateStatus("No active tab found", "error")
            return
        }

        const hostname = new URL(this.currentTab.url).hostname
        if (!hostname.includes("outline.uwaterloo.ca")) {
            this.updateStatus(
                "Please navigate to outline.uwaterloo.ca first",
                "error",
            )
            return
        }

        const selectedTerms = this.getSelectedTerms()
        if (selectedTerms.length === 0) {
            this.updateStatus(
                "Please select at least one term to process",
                "error",
            )
            return
        }

        this.showLoading()
        this.downloadOutlinesBtn.disabled = true
        this.updateStatus("Extracting course outline URLs...", "info")

        try {
            // First, extract URLs from the current page
            const extractResponse = await chrome.runtime.sendMessage({
                type: "EXTRACT_OUTLINE_URLS",
            })

            if (!extractResponse || !extractResponse.success) {
                throw new Error(
                    extractResponse?.error ||
                        "Failed to extract course outline URLs",
                )
            }

            // Use coursesByTerm if available, otherwise fall back to urls array
            const courseData = extractResponse.coursesByTerm
                ? { coursesByTerm: extractResponse.coursesByTerm }
                : { urls: extractResponse.urls || [] }

            // Count courses in selected terms
            let totalCourses = 0
            if (courseData.coursesByTerm) {
                selectedTerms.forEach((term) => {
                    totalCourses += courseData.coursesByTerm[term]?.length || 0
                })
            } else {
                totalCourses = courseData.urls.length
            }

            if (totalCourses === 0) {
                this.updateStatus(
                    "No course outline URLs found for selected terms. Make sure you're on the listings page.",
                    "error",
                )
                return
            }

            this.updateStatus(
                `Found ${totalCourses} course outlines for selected terms. Processing...`,
                "info",
            )

            // Show cancel button
            this.showCancelButton()

            // Store totalCourses for use in progress listener
            const expectedTotal = totalCourses

            // Set up progress listener before starting processing
            const progressListener = (message) => {
                if (message.type === "DOWNLOAD_PROGRESS") {
                    const statusText = message.currentUrl
                        ? `Processing ${message.current}/${message.total}... (${message.currentUrl.split("/").pop()})`
                        : `Processing ${message.current}/${message.total}...`
                    this.updateStatus(
                        `${statusText} (${message.success} successful, ${message.failed} failed)`,
                        "info",
                    )
                } else if (message.type === "DOWNLOAD_COMPLETE") {
                    if (message.cancelled) {
                        this.updateStatus(
                            `Processing cancelled. ${message.successCount} courses were processed before cancellation.`,
                            "info",
                        )
                    } else if (message.success) {
                        this.updateStatus(
                            `✅ Successfully processed ${message.successCount} out of ${expectedTotal} course outlines! They've been added to your database.`,
                            "success",
                        )
                    } else {
                        this.updateStatus(
                            `Processing completed with errors: ${message.error || "Unknown error"}`,
                            "error",
                        )
                    }
                    chrome.runtime.onMessage.removeListener(progressListener)
                    this.hideLoading()
                    this.hideCancelButton()
                } else if (message.type === "PROCESSING_CANCELLED") {
                    this.updateStatus("Processing cancelled", "info")
                    chrome.runtime.onMessage.removeListener(progressListener)
                    this.hideLoading()
                    this.hideCancelButton()
                }
            }

            chrome.runtime.onMessage.addListener(progressListener)

            // Start batch processing
            const downloadResponse = await chrome.runtime.sendMessage({
                type: "BATCH_DOWNLOAD_OUTLINES",
                urls: courseData,
                selectedTerms: selectedTerms,
            })

            if (downloadResponse && downloadResponse.success) {
                if (downloadResponse.started) {
                    this.updateStatus(
                        `Processing started! ${totalCourses} course outlines from ${selectedTerms.length} term(s) will be processed automatically.`,
                        "info",
                    )
                }
            } else {
                this.updateStatus(
                    `Processing failed: ${downloadResponse?.error || "Unknown error"}`,
                    "error",
                )
                chrome.runtime.onMessage.removeListener(progressListener)
                this.hideLoading()
                this.hideCancelButton()
            }
        } catch (error) {
            console.error("Error downloading outlines:", error)
            this.updateStatus(
                `Error: ${error.message || "Failed to download outlines"}`,
                "error",
            )
        } finally {
            this.hideLoading()
            this.downloadOutlinesBtn.disabled = false
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new WatSearchPopup()
})
