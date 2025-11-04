// Enhanced content script for WatSearch - follows links and extracts data from multiple pages

class EnhancedWatSearchExtractor {
    constructor() {
        this.currentSite = this.detectSite()
        this.extractedData = {
            site: this.currentSite,
            timestamp: new Date().toISOString(),
            data: {},
            pages: [], // Store data from multiple pages
        }
        this.visitedUrls = new Set()
        this.maxDepth = 3 // Maximum depth to follow links
        this.maxPages = 20 // Maximum number of pages to visit
    }

    detectSite() {
        const hostname = window.location.hostname
        if (hostname.includes("learn.uwaterloo.ca")) return "LEARN"
        if (hostname.includes("quest.uwaterloo.ca")) return "Quest"
        if (hostname.includes("piazza.com")) return "Piazza"
        return "Unknown"
    }

    // Enhanced LEARN data extraction with link following
    async extractLEARNData() {
        console.log("WatSearch: Enhanced LEARN data extraction...")

        const courses = []
        const assignments = []
        const announcements = []
        const contentPages = []

        // Extract course information from current page
        const courseInfo = this.extractCourseInfo()
        if (courseInfo) {
            courses.push(courseInfo)
        }

        // Extract assignments from current page
        const currentAssignments = this.extractAssignmentsFromPage()
        assignments.push(...currentAssignments)

        // Extract announcements from current page
        const currentAnnouncements = this.extractAnnouncementsFromPage()
        announcements.push(...currentAnnouncements)

        // Find and follow content links
        const contentLinks = this.findContentLinks()
        console.log(
            `WatSearch: Found ${contentLinks.length} content links to follow`,
        )

        // Follow links and extract data
        for (const link of contentLinks.slice(0, this.maxPages)) {
            try {
                const pageData = await this.followLinkAndExtract(link)
                if (pageData) {
                    contentPages.push(pageData)

                    // Extract assignments from this page
                    if (pageData.assignments) {
                        assignments.push(...pageData.assignments)
                    }

                    // Extract announcements from this page
                    if (pageData.announcements) {
                        announcements.push(...pageData.announcements)
                    }
                }
            } catch (error) {
                console.error(
                    `WatSearch: Error following link ${link.url}:`,
                    error,
                )
            }
        }

        return {
            courses,
            assignments,
            announcements,
            contentPages,
            totalPages: contentPages.length + 1,
        }
    }

    // Extract course information from current page
    extractCourseInfo() {
        const courseTitle = document
            .querySelector(".d2l-page-header h1")
            ?.textContent?.trim()
        const courseCode = document
            .querySelector(".d2l-page-header .d2l-heading-3")
            ?.textContent?.trim()

        if (courseTitle || courseCode) {
            return {
                id: `learn-${Date.now()}`,
                name: courseTitle || "Unknown Course",
                code: courseCode || "Unknown",
                term: this.extractCurrentTerm(),
                url: window.location.href,
                lastUpdated: new Date().toISOString(),
            }
        }
        return null
    }

    // Extract assignments from current page
    extractAssignmentsFromPage() {
        const assignments = []

        // Debug: Log all links on the page
        const allPageLinks = document.querySelectorAll("a")
        console.log(
            `WatSearch: Found ${allPageLinks.length} total links on page`,
        )

        // Log first few links for debugging
        allPageLinks.forEach((link, index) => {
            if (index < 5) {
                console.log(
                    `WatSearch: Link ${index}: "${link.textContent?.trim()}" -> ${
                        link.href
                    }`,
                )
            }
        })

        // Log specific LEARN content links for debugging
        const learnContentLinks = document.querySelectorAll(
            'a[href*="viewContent"]',
        )
        console.log(
            `WatSearch: Found ${learnContentLinks.length} viewContent links`,
        )
        learnContentLinks.forEach((link, index) => {
            if (index < 3) {
                console.log(
                    `WatSearch: viewContent ${index}: "${link.textContent?.trim()}" -> ${
                        link.href
                    }`,
                )
            }
        })

        // Try multiple selectors for LEARN content - based on actual SE 380 structure
        const selectors = [
            // Specific LEARN content selectors
            'a[href*="viewContent"]', // Main content links
            'a[id^="d2l_content_"]', // Content with specific IDs
            'a.d2l-link[href*="content"]', // d2l-link with content URLs
            'a[href*="assignment"]',
            'a[href*="quiz"]',
            'a[href*="exam"]',
            'a[href*="dropbox"]',
            'a[href*="content"]',
            ".d2l-link",
            ".d2l-navigation-link",
            'a[href*="/content/"]',
            'a[href*="/dropbox/"]',
            'a[href*="/quiz/"]',
            'a[href*="/assignment/"]',
            'a[href*="d2l"]', // LEARN uses d2l in URLs
            'a[href*="learn"]', // Sometimes LEARN URLs contain 'learn'
        ]

        const allLinks = new Set()
        selectors.forEach((selector) => {
            const links = document.querySelectorAll(selector)
            console.log(
                `WatSearch: Selector "${selector}" found ${links.length} links`,
            )
            links.forEach((link) => allLinks.add(link))
        })

        console.log(
            `WatSearch: Found ${allLinks.size} potential links after deduplication`,
        )

        allLinks.forEach((link, index) => {
            const title = link.textContent?.trim()
            const url = link.href

            if (title && url && title.length > 0) {
                console.log(`WatSearch: Processing link: "${title}" -> ${url}`)

                // Check if this looks like an assignment/quiz/exam or LEARN content
                const isAssignment =
                    url.includes("assignment") ||
                    url.includes("dropbox") ||
                    url.includes("quiz") ||
                    url.includes("exam") ||
                    url.includes("viewContent") || // LEARN content links
                    title.toLowerCase().includes("assignment") ||
                    title.toLowerCase().includes("quiz") ||
                    title.toLowerCase().includes("exam") ||
                    title.toLowerCase().includes("homework") ||
                    title.toLowerCase().includes("lab") ||
                    title.toLowerCase().includes("project") ||
                    title.toLowerCase().includes("tutorial") || // SE 380 has tutorials
                    title.toLowerCase().includes("lecture") ||
                    title.toLowerCase().includes("notes") ||
                    title.toLowerCase().includes("slides")

                if (isAssignment) {
                    console.log(`WatSearch: Found assignment: "${title}"`)
                    assignments.push({
                        id: `assignment-${index}`,
                        title,
                        url,
                        type: this.determineAssignmentType(url),
                        course: this.getCurrentCourse(),
                        extractedFrom: "table_of_contents",
                    })
                }
            }
        })

        // If no assignments found, try to extract any content links as potential assignments
        if (assignments.length === 0) {
            console.log(
                "WatSearch: No assignments found, trying to extract any content links...",
            )

            allPageLinks.forEach((link, index) => {
                const title = link.textContent?.trim()
                const url = link.href

                // Look for any LEARN content links (more permissive)
                if (
                    title &&
                    url &&
                    title.length > 0 &&
                    (url.includes("viewContent") ||
                        url.includes("d2l") ||
                        url.includes("learn") ||
                        url.includes("uwaterloo"))
                ) {
                    // This looks like a LEARN content link
                    assignments.push({
                        id: `content-${index}`,
                        title,
                        url,
                        type: "content",
                        course: this.getCurrentCourse(),
                        extractedFrom: "table_of_contents",
                    })
                }
            })

            console.log(
                `WatSearch: Extracted ${assignments.length} content links as potential assignments`,
            )
        }

        console.log(
            `WatSearch: Final result - ${assignments.length} assignments`,
        )
        return assignments
    }

    // Extract announcements from current page
    extractAnnouncementsFromPage() {
        const announcements = []

        // Try multiple selectors for announcements
        const selectors = [
            'a[href*="announcement"]',
            'a[href*="news"]',
            'a[href*="/announcements/"]',
            ".d2l-link",
            ".d2l-navigation-link",
        ]

        const allLinks = new Set()
        selectors.forEach((selector) => {
            const links = document.querySelectorAll(selector)
            links.forEach((link) => allLinks.add(link))
        })

        allLinks.forEach((link, index) => {
            const title = link.textContent?.trim()
            const url = link.href

            if (title && url && title.length > 0) {
                // Check if this looks like an announcement
                const isAnnouncement =
                    url.includes("announcement") ||
                    url.includes("news") ||
                    title.toLowerCase().includes("announcement") ||
                    title.toLowerCase().includes("news") ||
                    title.toLowerCase().includes("update")

                if (isAnnouncement) {
                    announcements.push({
                        id: `announcement-${index}`,
                        title,
                        url,
                        course: this.getCurrentCourse(),
                        extractedFrom: "table_of_contents",
                    })
                }
            }
        })

        console.log(
            `WatSearch: Extracted ${announcements.length} announcements`,
        )
        return announcements
    }

    // Find content links to follow
    findContentLinks() {
        const links = []

        // Find assignment links
        const assignmentLinks = document.querySelectorAll(
            'a[href*="assignment"], a[href*="quiz"], a[href*="exam"]',
        )
        assignmentLinks.forEach((link) => {
            if (link.href && !this.visitedUrls.has(link.href)) {
                links.push({
                    url: link.href,
                    title: link.textContent.trim(),
                    type: "assignment",
                    priority: "high",
                })
            }
        })

        // Find content links
        const contentLinks = document.querySelectorAll(
            'a[href*="/content/"], a[href*="/lessons/"]',
        )
        contentLinks.forEach((link) => {
            if (link.href && !this.visitedUrls.has(link.href)) {
                links.push({
                    url: link.href,
                    title: link.textContent.trim(),
                    type: "content",
                    priority: "medium",
                })
            }
        })

        // Find announcement links
        const announcementLinks = document.querySelectorAll(
            'a[href*="announcement"], a[href*="news"]',
        )
        announcementLinks.forEach((link) => {
            if (link.href && !this.visitedUrls.has(link.href)) {
                links.push({
                    url: link.href,
                    title: link.textContent.trim(),
                    type: "announcement",
                    priority: "medium",
                })
            }
        })

        // Sort by priority
        return links.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
    }

    // Follow a link and extract data
    async followLinkAndExtract(linkInfo) {
        try {
            console.log(
                `WatSearch: Following link: ${linkInfo.title} (${linkInfo.url})`,
            )

            // Mark as visited
            this.visitedUrls.add(linkInfo.url)

            // Create a new tab to fetch the content
            const response = await fetch(linkInfo.url, {
                method: "GET",
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`,
                )
            }

            const html = await response.text()
            const parser = new DOMParser()
            const doc = parser.parseFromString(html, "text/html")

            // Extract data from the fetched page
            const pageData = {
                url: linkInfo.url,
                title: linkInfo.title,
                type: linkInfo.type,
                extractedAt: new Date().toISOString(),
                assignments: [],
                announcements: [],
                content: [],
            }

            // Extract assignments from this page
            if (linkInfo.type === "assignment") {
                const assignmentData = this.extractAssignmentDetails(doc)
                if (assignmentData) {
                    pageData.assignments.push(assignmentData)
                }
            }

            // Extract announcements from this page
            if (linkInfo.type === "announcement") {
                const announcementData = this.extractAnnouncementDetails(doc)
                if (announcementData) {
                    pageData.announcements.push(announcementData)
                }
            }

            // Extract general content
            const contentData = this.extractContentDetails(doc)
            if (contentData) {
                pageData.content.push(contentData)
            }

            return pageData
        } catch (error) {
            console.error(`WatSearch: Error fetching ${linkInfo.url}:`, error)
            return null
        }
    }

    // Extract assignment details from a page
    extractAssignmentDetails(doc) {
        const title = doc
            .querySelector("h1, .d2l-page-header h1")
            ?.textContent?.trim()
        const description = doc
            .querySelector(".d2l-htmlblock, .d2l-htmlblock p")
            ?.textContent?.trim()
        const dueDate = doc
            .querySelector('[class*="due"], [class*="deadline"]')
            ?.textContent?.trim()
        const points = doc
            .querySelector('[class*="point"], [class*="grade"]')
            ?.textContent?.trim()

        if (title) {
            return {
                title,
                description: description || "",
                dueDate: dueDate || "",
                points: points || "",
                course: this.getCurrentCourse(),
                extractedFrom: "assignment_page",
            }
        }
        return null
    }

    // Extract announcement details from a page
    extractAnnouncementDetails(doc) {
        const title = doc
            .querySelector("h1, .d2l-page-header h1")
            ?.textContent?.trim()
        const content = doc
            .querySelector(".d2l-htmlblock, .d2l-htmlblock p")
            ?.textContent?.trim()
        const date = doc
            .querySelector('[class*="date"], [class*="time"]')
            ?.textContent?.trim()

        if (title) {
            return {
                title,
                content: content || "",
                date: date || "",
                course: this.getCurrentCourse(),
                extractedFrom: "announcement_page",
            }
        }
        return null
    }

    // Extract general content from a page
    extractContentDetails(doc) {
        const title = doc
            .querySelector("h1, .d2l-page-header h1")
            ?.textContent?.trim()
        const content = doc
            .querySelector(".d2l-htmlblock, .d2l-htmlblock p")
            ?.textContent?.trim()

        if (title) {
            return {
                title,
                content: content || "",
                course: this.getCurrentCourse(),
                extractedFrom: "content_page",
            }
        }
        return null
    }

    // Determine assignment type from URL
    determineAssignmentType(url) {
        if (url.includes("quiz")) return "quiz"
        if (url.includes("exam")) return "exam"
        if (url.includes("assignment")) return "assignment"
        return "unknown"
    }

    // Get current course name
    getCurrentCourse() {
        const courseTitle = document
            .querySelector(".d2l-page-header h1")
            ?.textContent?.trim()
        return courseTitle || "Unknown Course"
    }

    // Extract current term
    extractCurrentTerm() {
        const termElement = document.querySelector(
            '[class*="term"], [class*="semester"]',
        )
        return termElement?.textContent?.trim() || "Fall 2025"
    }

    // Main extraction method
    async extractData() {
        console.log(
            `WatSearch: Enhanced extraction from ${this.currentSite}...`,
        )

        switch (this.currentSite) {
            case "LEARN":
                this.extractedData.data = await this.extractLEARNData()
                break
            case "Quest":
                this.extractedData.data = this.extractQuestData()
                break
            case "Piazza":
                this.extractedData.data = this.extractPiazzaData()
                break
            default:
                console.log("WatSearch: Unknown site, no data extracted")
                return null
        }

        console.log("WatSearch: Enhanced data extracted:", this.extractedData)
        return this.extractedData
    }

    // Send data to WatSearch
    sendToWatSearch() {
        console.log("WatSearch: Sending enhanced data to WatSearch...")

        // Send to background script
        chrome.runtime.sendMessage(
            {
                type: "COURSE_DATA",
                data: this.extractedData,
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error(
                        "WatSearch: Error sending data:",
                        chrome.runtime.lastError,
                    )
                } else {
                    console.log(
                        "WatSearch: Enhanced data sent successfully:",
                        response,
                    )
                }
            },
        )
    }

    // Legacy methods for Quest and Piazza (unchanged)
    extractQuestData() {
        console.log("WatSearch: Extracting Quest data...")
        // ... existing Quest extraction logic
        return { schedule: [], courses: [] }
    }

    extractPiazzaData() {
        console.log("WatSearch: Extracting Piazza data...")
        // ... existing Piazza extraction logic
        return { posts: [], discussions: [] }
    }
}

// Initialize enhanced extractor
const enhancedExtractor = new EnhancedWatSearchExtractor()

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_DATA") {
        enhancedExtractor.extractData().then((data) => {
            sendResponse({ success: true, data })
        })
    } else if (request.type === "SEND_TO_WATSEARCH") {
        enhancedExtractor.sendToWatSearch()
        sendResponse({ success: true })
    }
    return true // Keep message channel open for async response
})

// Auto-extract data when page is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => enhancedExtractor.sendToWatSearch(), 3000) // Wait 3 seconds for page to fully load
    })
} else {
    setTimeout(() => enhancedExtractor.sendToWatSearch(), 3000)
}

// Show notification when data is extracted
const showNotification = (message) => {
    const notification = document.createElement("div")
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #d32f2f;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
        notification.remove()
    }, 5000)
}

// Show notification when data is extracted
enhancedExtractor.sendToWatSearch()
showNotification("WatSearch: Enhanced course data extracted!")
