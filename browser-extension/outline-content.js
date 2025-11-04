// WatSearch Browser Extension - Outline.uwaterloo.ca Content Script
// Extracts course outline URLs from the listings page and HTML from course pages

class OutlineContent {
    constructor() {
        this.setupMessageListener()
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
                if (request.type === "EXTRACT_URLS") {
                    const result = this.extractCourseUrls()
                    sendResponse({ success: true, ...result })
                } else if (request.type === "EXTRACT_HTML") {
                    // Extract the full HTML content from a course outline page
                    const html = this.extractFullHTML()
                    sendResponse({ success: true, html })
                } else if (request.type === "PING") {
                    // Respond to ping to confirm content script is ready
                    sendResponse({ success: true })
                }
                return true
            },
        )
    }

    extractCourseUrls() {
        const coursesByTerm = {}
        const allUrls = []

        // Find all term sections (both in live page and saved HTML)
        const termSections = document.querySelectorAll(
            ".border.rounded, div.border",
        )

        termSections.forEach((section) => {
            // Try to find term header
            const termHeader = section.querySelector("h3.text-xl, h3")
            if (!termHeader) return

            const term = termHeader.textContent.trim()
            if (!term) return

            // Find all course links in this term section
            const links = section.querySelectorAll('a[href*="/viewer/view/"]')
            const termCourses = []

            links.forEach((link) => {
                const href = link.getAttribute("href")
                if (href) {
                    const fullUrl = href.startsWith("http")
                        ? href
                        : `https://outline.uwaterloo.ca${href}`

                    if (!allUrls.includes(fullUrl)) {
                        allUrls.push(fullUrl)
                        termCourses.push(fullUrl)
                    }
                }
            })

            if (termCourses.length > 0) {
                coursesByTerm[term] = termCourses
            }
        })

        // Fallback: if no term sections found, extract all URLs
        if (Object.keys(coursesByTerm).length === 0) {
            const viewLinks = document.querySelectorAll(
                'a[href*="/viewer/view/"]',
            )
            const urls = []

            viewLinks.forEach((link) => {
                const href = link.getAttribute("href")
                if (href) {
                    const fullUrl = href.startsWith("http")
                        ? href
                        : `https://outline.uwaterloo.ca${href}`

                    if (!urls.includes(fullUrl)) {
                        urls.push(fullUrl)
                    }
                }
            })

            console.log(
                `WatSearch Outline: Extracted ${urls.length} course outline URLs (no term grouping found)`,
            )
            return { urls, coursesByTerm: {} }
        }

        console.log(
            `WatSearch Outline: Extracted courses from ${Object.keys(coursesByTerm).length} terms`,
        )
        return { urls: allUrls, coursesByTerm }
    }

    extractFullHTML() {
        // Get the full HTML of the page, including any dynamically rendered content
        // For Vue.js pages, we need to wait for it to render
        const html = document.documentElement.outerHTML

        // Also try to get the rendered content if it's in a Vue app
        const appElement = document.querySelector("#app")
        if (appElement && appElement.innerHTML) {
            // The page might be a SPA, so we return the full document HTML
            // which should include the rendered content
            return document.documentElement.outerHTML
        }

        return html
    }

    // Extract course information from the current page (if viewing a course outline)
    extractCourseInfo() {
        const courseCode = document
            .querySelector(".outline-courses")
            ?.textContent?.trim()
        const term = document
            .querySelector(".outline-term")
            ?.textContent?.trim()
        const title = document
            .querySelector(".outline-title-full")
            ?.textContent?.trim()

        if (courseCode && title) {
            return {
                code: courseCode,
                term: term || "",
                title: title,
                url: window.location.href,
            }
        }

        return null
    }
}

// Initialize content script
new OutlineContent()
