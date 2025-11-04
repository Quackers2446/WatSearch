// WatSearch Browser Extension - Content Script
// Extracts course data from University of Waterloo platforms

class WatSearchDataExtractor {
    constructor() {
        this.currentSite = this.detectSite()
        this.extractedData = {
            site: this.currentSite,
            timestamp: new Date().toISOString(),
            data: {},
        }
    }

    detectSite() {
        const hostname = window.location.hostname
        if (hostname.includes("learn.uwaterloo.ca")) return "LEARN"
        if (hostname.includes("quest.uwaterloo.ca")) return "Quest"
        if (hostname.includes("piazza.com")) return "Piazza"
        return "Unknown"
    }

    // Extract data from LEARN
    extractLEARNData() {
        console.log("WatSearch: Extracting LEARN data...")

        const courses = []
        const assignments = []
        const announcements = []

        // Extract course information
        const courseElements = document.querySelectorAll(
            '.course-item, .course-card, [class*="course"]',
        )
        courseElements.forEach((element, index) => {
            const courseName = this.extractText(
                element,
                ".course-title, .course-name, h3, h4",
            )
            const courseCode = this.extractText(
                element,
                ".course-code, .course-id",
            )

            if (courseName || courseCode) {
                courses.push({
                    id: `learn-${index}`,
                    name: courseName,
                    code: courseCode,
                    term: this.extractText(element, ".term, .semester"),
                    instructor: this.extractText(
                        element,
                        ".instructor, .professor",
                    ),
                    url: element.querySelector("a")?.href,
                })
            }
        })

        // Extract assignments
        const assignmentElements = document.querySelectorAll(
            '.assignment, .assignment-item, [class*="assignment"]',
        )
        assignmentElements.forEach((element, index) => {
            const title = this.extractText(
                element,
                ".assignment-title, .title, h3, h4",
            )
            const dueDate = this.extractText(
                element,
                ".due-date, .deadline, .date",
            )
            const points = this.extractText(element, ".points, .grade, .weight")

            if (title) {
                assignments.push({
                    id: `learn-assignment-${index}`,
                    title,
                    dueDate: this.parseDate(dueDate),
                    points: this.parsePoints(points),
                    course: this.getCurrentCourse(),
                    type: "assignment",
                })
            }
        })

        // Extract announcements
        const announcementElements = document.querySelectorAll(
            '.announcement, .news-item, [class*="announcement"]',
        )
        announcementElements.forEach((element, index) => {
            const title = this.extractText(
                element,
                ".announcement-title, .title, h3, h4",
            )
            const content = this.extractText(
                element,
                ".content, .message, .body",
            )
            const date = this.extractText(element, ".date, .timestamp")

            if (title) {
                announcements.push({
                    id: `learn-announcement-${index}`,
                    title,
                    content,
                    date: this.parseDate(date),
                    course: this.getCurrentCourse(),
                })
            }
        })

        return {
            courses,
            assignments,
            announcements,
        }
    }

    // Extract data from Quest
    extractQuestData() {
        console.log("WatSearch: Extracting Quest data...")

        const schedule = []
        const courses = []

        // Extract course schedule
        const scheduleRows = document.querySelectorAll(
            'tr, .schedule-row, [class*="schedule"]',
        )
        scheduleRows.forEach((row, index) => {
            const courseCode = this.extractText(
                row,
                ".course-code, .subject, .course",
            )
            const courseName = this.extractText(row, ".course-name, .title")
            const time = this.extractText(row, ".time, .schedule-time")
            const location = this.extractText(
                row,
                ".location, .room, .building",
            )
            const instructor = this.extractText(row, ".instructor, .professor")

            if (courseCode || courseName) {
                schedule.push({
                    id: `quest-schedule-${index}`,
                    courseCode,
                    courseName,
                    time,
                    location,
                    instructor,
                    term: this.extractCurrentTerm(),
                })
            }
        })

        // Extract course information
        const courseElements = document.querySelectorAll(
            '.course, .course-info, [class*="course"]',
        )
        courseElements.forEach((element, index) => {
            const courseCode = this.extractText(
                element,
                ".course-code, .subject",
            )
            const courseName = this.extractText(element, ".course-name, .title")
            const credits = this.extractText(element, ".credits, .units")
            const term = this.extractText(element, ".term, .semester")

            if (courseCode || courseName) {
                courses.push({
                    id: `quest-course-${index}`,
                    code: courseCode,
                    name: courseName,
                    credits: this.parseCredits(credits),
                    term,
                    url: window.location.href,
                })
            }
        })

        return {
            schedule,
            courses,
        }
    }

    // Extract data from Piazza
    extractPiazzaData() {
        console.log("WatSearch: Extracting Piazza data...")

        const posts = []
        const discussions = []

        // Extract posts and discussions
        const postElements = document.querySelectorAll(
            '.post, .discussion, [class*="post"]',
        )
        postElements.forEach((element, index) => {
            const title = this.extractText(
                element,
                ".post-title, .title, h3, h4",
            )
            const content = this.extractText(
                element,
                ".content, .body, .message",
            )
            const author = this.extractText(element, ".author, .user, .poster")
            const date = this.extractText(element, ".date, .timestamp, .time")
            const tags = this.extractTags(element)

            if (title) {
                posts.push({
                    id: `piazza-post-${index}`,
                    title,
                    content,
                    author,
                    date: this.parseDate(date),
                    tags,
                    course: this.getCurrentCourse(),
                })
            }
        })

        return {
            posts,
            discussions,
        }
    }

    // Helper methods
    extractText(element, selector) {
        const found = element.querySelector(selector)
        return found ? found.textContent.trim() : ""
    }

    extractTags(element) {
        const tagElements = element.querySelectorAll(
            '.tag, .label, [class*="tag"]',
        )
        return Array.from(tagElements).map((tag) => tag.textContent.trim())
    }

    parseDate(dateString) {
        if (!dateString) return null
        try {
            return new Date(dateString).toISOString()
        } catch {
            return dateString
        }
    }

    parsePoints(pointsString) {
        if (!pointsString) return null
        const match = pointsString.match(/(\d+)/)
        return match ? parseInt(match[1]) : null
    }

    parseCredits(creditsString) {
        if (!creditsString) return null
        const match = creditsString.match(/(\d+(?:\.\d+)?)/)
        return match ? parseFloat(match[1]) : null
    }

    getCurrentCourse() {
        // Try to determine current course from URL or page content
        const url = window.location.href
        const courseMatch = url.match(/course[\/=]([^\/\?]+)/i)
        if (courseMatch) return courseMatch[1]

        const title = document.title
        const titleMatch = title.match(/([A-Z]{2,4}\s*\d{3})/i)
        if (titleMatch) return titleMatch[1]

        return "Unknown"
    }

    extractCurrentTerm() {
        const termElements = document.querySelectorAll(
            '.term, .semester, [class*="term"]',
        )
        for (const element of termElements) {
            const text = element.textContent.trim()
            if (text) return text
        }
        return "Fall 2025" // Default fallback
    }

    // Main extraction method
    extractData() {
        console.log(`WatSearch: Extracting data from ${this.currentSite}...`)

        switch (this.currentSite) {
            case "LEARN":
                this.extractedData.data = this.extractLEARNData()
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

        console.log("WatSearch: Data extracted:", this.extractedData)
        return this.extractedData
    }

    // Send data to WatSearch application
    sendToWatSearch() {
        const data = this.extractData()
        if (!data) return

        // Send to background script
        chrome.runtime.sendMessage(
            {
                type: "COURSE_DATA",
                data: data,
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error(
                        "WatSearch: Error sending data:",
                        chrome.runtime.lastError,
                    )
                } else {
                    console.log("WatSearch: Data sent successfully:", response)
                }
            },
        )
    }
}

// Initialize extractor when page loads
const extractor = new WatSearchDataExtractor()

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_DATA") {
        const data = extractor.extractData()
        sendResponse({ success: true, data })
    } else if (request.type === "SEND_TO_WATSEARCH") {
        extractor.sendToWatSearch()
        sendResponse({ success: true })
    }
})

// Auto-extract data when page is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => extractor.sendToWatSearch(), 2000) // Wait 2 seconds for page to fully load
    })
} else {
    setTimeout(() => extractor.sendToWatSearch(), 2000)
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
    }, 3000)
}

// Show notification when data is extracted
extractor.sendToWatSearch()
showNotification("WatSearch: Course data extracted!")
