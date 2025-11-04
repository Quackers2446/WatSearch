import { NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync, readdirSync } from "fs"
import { join } from "path"
import * as cheerio from "cheerio"
import { Course, Assessment, Material } from "@/types"

// Increase timeout for long-running requests (fetching multiple courses)
export const maxDuration = 300 // 5 minutes
export const dynamic = "force-dynamic"

interface CourseListing {
    code: string
    title: string
    term: string
    sections: string[]
    viewUrl: string
    outlineId: string
}

/**
 * Parse course listings from the Outline.uwaterloo.ca.html file
 */
function parseCourseListings(html: string): CourseListing[] {
    const $ = cheerio.load(html)
    const courses: CourseListing[] = []

    // Find all term sections
    $("div.border").each((_, borderDiv) => {
        const termHeader = $(borderDiv).find("h3.text-xl")
        if (termHeader.length === 0) return

        const term = termHeader.text().trim()
        const table = $(borderDiv).find("table tbody")

        table.find("tr").each((_, row) => {
            const cells = $(row).find("td")

            if (cells.length >= 4) {
                const code = cells.eq(0).find("span").text().trim()
                const title = cells.eq(1).text().trim()
                const sectionsText = cells.eq(2).text().trim()
                const sections = sectionsText.split(",").map((s) => s.trim())
                const viewLink = cells
                    .eq(3)
                    .find('a[href*="/viewer/view/"]')
                    .attr("href")

                if (code && viewLink) {
                    const outlineIdMatch = viewLink.match(
                        /\/viewer\/view\/([^/]+)/,
                    )
                    const outlineId = outlineIdMatch ? outlineIdMatch[1] : ""
                    const fullUrl = viewLink.startsWith("http")
                        ? viewLink
                        : `https://outline.uwaterloo.ca${viewLink}`

                    courses.push({
                        code,
                        title,
                        term,
                        sections,
                        viewUrl: fullUrl,
                        outlineId,
                    })
                }
            }
        })
    })

    return courses
}

/**
 * Parse a single course outline HTML
 */
function parseCourseOutline(html: string, url?: string): Course | null {
    try {
        const $ = cheerio.load(html)

        // Try multiple selectors for course code
        let courseCode = $(".outline-courses").text().trim()
        if (!courseCode) {
            // Try alternative selectors
            courseCode =
                $('[class*="course-code"]').text().trim() ||
                $("h1")
                    .text()
                    .match(/([A-Z]{2,4}\s*\d{3})/)?.[1]
                    ?.trim() ||
                $("title")
                    .text()
                    .match(/([A-Z]{2,4}\s*\d{3})/)?.[1]
                    ?.trim() ||
                ""
        }

        // Try multiple selectors for term
        let term = $(".outline-term").text().trim()
        if (!term) {
            term =
                $('[class*="term"]').text().trim() ||
                html.match(/(Fall|Winter|Spring)\s+\d{4}/i)?.[0]?.trim() ||
                ""
        }

        // Try multiple selectors for title
        let title = $(".outline-title-full").text().trim()
        if (!title) {
            title =
                $(".outline-title").text().trim() ||
                $("h1").text().trim() ||
                $("h2").text().trim() ||
                $('[class*="title"]').first().text().trim() ||
                ""
        }

        // Check if this is a JavaScript-rendered page (SPA)
        const isSPA =
            html.includes("data-v-app") ||
            html.includes("vue") ||
            html.includes("react") ||
            html.includes('id="app"') ||
            ($("#app").length > 0 && $("#app").text().trim().length < 100)

        if (isSPA && (!courseCode || !title)) {
            // Try to extract from JSON data embedded in the page
            const jsonMatch =
                html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/) ||
                html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/) ||
                html.match(
                    /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/,
                )

            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[1])
                    // Try to extract course info from JSON structure
                    if (data.course) {
                        courseCode = data.course.code || courseCode
                        title = data.course.title || data.course.name || title
                        term = data.course.term || term
                    }
                } catch (e) {
                    // JSON parsing failed, continue with regular parsing
                }
            }
        }

        // If still no course code or title, try to extract from URL or page structure
        if (!courseCode && url) {
            const urlMatch = url.match(/view\/([^/]+)/)
            if (urlMatch) {
                // Can't extract course code from URL ID, but we can note it
            }
        }

        // Last resort: try to find course code in any text content
        if (!courseCode) {
            const codeMatch = html.match(/([A-Z]{2,4}\s*\d{3})/i)
            if (codeMatch) {
                courseCode = codeMatch[1].trim()
            }
        }

        if (!courseCode || !title) {
            // Log what we found for debugging
            console.log(
                `Failed to parse: courseCode="${courseCode}", title="${title}", term="${term}"`,
            )
            console.log(
                `HTML length: ${html.length}, Contains app div: ${$("#app").length > 0}`,
            )
            if (html.length < 5000) {
                console.log(`HTML preview: ${html.substring(0, 500)}`)
            }
            return null
        }

        const sections: string[] = []
        $(".section").each((_, el) => {
            sections.push($(el).text().trim())
        })

        const instructorName = $(".instructor-info span").first().text().trim()
        const instructorEmail =
            $(".instructor-info small a")
                .first()
                .attr("href")
                ?.replace("mailto:", "") || ""
        const instructorOffice = $(".instructor-info")
            .text()
            .includes("Office:")
            ? $(".instructor-info")
                  .text()
                  .split("Office:")[1]
                  ?.split("\n")[0]
                  ?.trim()
            : undefined

        const scheduleDays: string[] = []
        $(".days-visual span.present").each((_, el) => {
            scheduleDays.push($(el).text().trim().replace(",", ""))
        })
        const scheduleTime = $("td")
            .filter(
                (_, el) =>
                    $(el).text().includes("PM") || $(el).text().includes("AM"),
            )
            .first()
            .text()
            .trim()
        const location = $("td")
            .filter(
                (_, el) =>
                    $(el).text().includes("MC") ||
                    $(el).text().includes("DC") ||
                    $(el).text().includes("EV"),
            )
            .first()
            .text()
            .trim()

        const description = $("#course_description")
            .nextAll(".dynamic-component, .html-block")
            .first()
            .text()
            .trim()

        const learningOutcomes: string[] = []
        $(
            "#learning_outcomes + .multitable-container .multitable tbody tr td",
        ).each((_, el) => {
            learningOutcomes.push($(el).text().trim())
        })

        const assessments: Assessment[] = []
        $(
            "#assessments_amp_activities + .multitable-container .multitable tbody tr",
        ).each((_, el) => {
            const cells = $(el).find("td")
            if (cells.length >= 4) {
                const name = cells.eq(0).text().trim()
                const dueDateText = cells.eq(1).text().trim()
                const location = cells.eq(2).text().trim()
                const weightText = cells.eq(3).text().trim()
                const weight = parseFloat(weightText.replace("%", ""))

                if (name && !isNaN(weight)) {
                    let dueDate: Date | undefined
                    if (dueDateText) {
                        try {
                            dueDate = new Date(dueDateText)
                            if (isNaN(dueDate.getTime())) {
                                dueDate = undefined
                            }
                        } catch {
                            dueDate = undefined
                        }
                    }

                    assessments.push({
                        id: `${courseCode}-${name.toLowerCase().replace(/\s+/g, "-")}`,
                        name,
                        type: name.toLowerCase().includes("exam")
                            ? "exam"
                            : "assignment",
                        weight,
                        dueDate,
                        description: location,
                    })
                }
            }
        })

        const materials: Material[] = []
        $("#readings + .multitable-container .multitable tbody tr").each(
            (_, el) => {
                const cells = $(el).find("td")
                if (cells.length >= 3) {
                    const title = cells.eq(0).text().trim()
                    const notes = cells.eq(1).text().trim()
                    const required =
                        cells.eq(2).text().trim().toLowerCase() === "yes"

                    if (title) {
                        materials.push({
                            id: `${courseCode}-${title.toLowerCase().replace(/\s+/g, "-")}`,
                            title,
                            type: "textbook",
                            required,
                            notes,
                        })
                    }
                }
            },
        )

        const policies: string[] = []
        $("#late_missed_content + .html-block p").each((_, el) => {
            policies.push($(el).text().trim())
        })

        return {
            id: courseCode.replace(/\s/g, "") + term.replace(/\s/g, ""),
            code: courseCode,
            name: title,
            term,
            sections,
            instructor: {
                name: instructorName || "TBA",
                email: instructorEmail,
                office: instructorOffice,
            },
            schedule: {
                days: scheduleDays,
                time: scheduleTime,
                location,
            },
            description,
            learningOutcomes,
            assessments,
            materials,
            policies,
        }
    } catch (error) {
        console.error("Error parsing course outline:", error)
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File
        const action = (formData.get("action") as string) || "process"

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 },
            )
        }

        // Read file content
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const html = buffer.toString("utf8")

        // Check if this is a listings file
        const isListingsFile =
            file.name.includes("Outline.uwaterloo.ca") ||
            html.includes("Browse Outlines") ||
            html.includes("My Enrolled Courses")

        if (isListingsFile) {
            // Parse course listings
            const listings = parseCourseListings(html)

            if (listings.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "No courses found in the listings file",
                    },
                    { status: 400 },
                )
            }

            // Save listings to a temporary file for reference
            const listingsPath = join(
                process.cwd(),
                "data",
                "course-listings.json",
            )
            writeFileSync(listingsPath, JSON.stringify(listings, null, 2))

            if (action === "parse_only") {
                return NextResponse.json({
                    success: true,
                    message: `Found ${listings.length} courses in the listings file`,
                    listings,
                    count: listings.length,
                })
            }

            // Create course entries from listings (with basic info)
            const coursesFromListings: Course[] = listings.map((listing) => ({
                id:
                    listing.code.replace(/\s/g, "") +
                    listing.term.replace(/\s/g, ""),
                code: listing.code,
                name: listing.title,
                term: listing.term,
                sections: listing.sections.map((s) => `${s} [LEC]`), // Format sections
                instructor: {
                    name: "TBA",
                    email: "",
                },
                schedule: {
                    days: [],
                    time: "",
                    location: "",
                },
                description: `Course outline for ${listing.code}: ${listing.title}. Detailed information will be available after downloading the full course outline.`,
                learningOutcomes: [],
                assessments: [],
                materials: [],
                policies: [],
            }))

            // Fetch and process all course outlines from URLs
            const coursesPath = join(process.cwd(), "data", "courses.json")

            let existingCourses: Course[] = []
            try {
                const existingData = readFileSync(coursesPath, "utf8")
                existingCourses = JSON.parse(existingData)
            } catch (error) {
                console.log("No existing courses file found, creating new one")
            }

            const parsedCourses: Course[] = []
            const errors: Array<{ code: string; url: string; error: string }> =
                []

            // Function to fetch HTML from URL with retry and timeout
            const fetchCourseOutline = async (
                url: string,
                retries = 2,
            ): Promise<string | null> => {
                for (let i = 0; i <= retries; i++) {
                    try {
                        const controller = new AbortController()
                        const timeoutId = setTimeout(
                            () => controller.abort(),
                            30000,
                        ) // 30 second timeout

                        try {
                            const response = await fetch(url, {
                                headers: {
                                    "User-Agent":
                                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                                    "Accept-Language": "en-US,en;q=0.5",
                                },
                                signal: controller.signal,
                            })

                            clearTimeout(timeoutId)

                            if (!response.ok) {
                                throw new Error(
                                    `HTTP ${response.status}: ${response.statusText}`,
                                )
                            }

                            return await response.text()
                        } catch (fetchError: any) {
                            clearTimeout(timeoutId)
                            throw fetchError
                        }
                    } catch (error: any) {
                        if (error.name === "AbortError") {
                            console.error(`Timeout fetching ${url}`)
                        }

                        if (i === retries) {
                            console.error(
                                `Failed to fetch ${url} after ${retries + 1} attempts:`,
                                error.message,
                            )
                            return null
                        }
                        // Wait before retrying (exponential backoff)
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000 * (i + 1)),
                        )
                    }
                }
                return null
            }

            // First, try to use any already downloaded outline files
            const courseOutlinesDir = join(process.cwd(), "course-outlines")
            const downloadedFiles = new Map<string, string>() // Map courseCode+term -> filePath

            try {
                const files = readdirSync(courseOutlinesDir).filter(
                    (file) =>
                        file.endsWith(".html") &&
                        !file.includes("Outline.uwaterloo.ca"),
                )

                for (const file of files) {
                    const filePath = join(courseOutlinesDir, file)
                    try {
                        // Read the file and extract course info
                        const html = readFileSync(filePath, "utf8")
                        const $ = cheerio.load(html)
                        const courseCode = $(".outline-courses").text().trim()
                        const term = $(".outline-term").text().trim()

                        // Create a key from course code and term for matching
                        if (courseCode && term) {
                            const key = `${courseCode}|${term}`
                            downloadedFiles.set(key, filePath)
                        }
                    } catch (e) {
                        // Skip files that can't be read
                    }
                }
            } catch (error) {
                console.log("Course outlines directory not found or empty")
            }

            // Process all course outlines
            console.log(`Processing ${listings.length} course outlines...`)
            console.log(
                `Found ${downloadedFiles.size} pre-downloaded outline files`,
            )

            for (let i = 0; i < listings.length; i++) {
                const listing = listings[i]
                console.log(
                    `[${i + 1}/${listings.length}] Processing ${listing.code}...`,
                )

                try {
                    let html: string | null = null
                    let source = ""

                    // First, try using a pre-downloaded file if available
                    const fileKey = `${listing.code}|${listing.term}`
                    if (downloadedFiles.has(fileKey)) {
                        const filePath = downloadedFiles.get(fileKey)!
                        try {
                            html = readFileSync(filePath, "utf8")
                            source = "saved file"
                            console.log(
                                `  Using saved file for ${listing.code} (${listing.term})`,
                            )
                        } catch (e) {
                            console.log(
                                `  Failed to read saved file for ${listing.code}, trying URL...`,
                            )
                        }
                    }

                    // If no saved file, fetch from URL
                    if (!html) {
                        html = await fetchCourseOutline(listing.viewUrl)
                        source = "URL"
                    }

                    if (html) {
                        // Check if HTML was successfully fetched (not just an error page)
                        if (
                            html.length < 1000 ||
                            (html.includes("error") && html.length < 5000)
                        ) {
                            errors.push({
                                code: listing.code,
                                url: listing.viewUrl,
                                error: `Received error page or empty response from ${source}`,
                            })
                            console.log(
                                `  ✗ Received error page for ${listing.code} (${html.length} chars from ${source})`,
                            )
                        } else {
                            const course = parseCourseOutline(
                                html,
                                listing.viewUrl,
                            )

                            if (course) {
                                parsedCourses.push(course)
                                console.log(
                                    `  ✓ Successfully parsed ${listing.code} from ${source}`,
                                )
                            } else {
                                errors.push({
                                    code: listing.code,
                                    url: listing.viewUrl,
                                    error: `Failed to parse course outline from ${source} - may require JavaScript rendering`,
                                })
                                console.log(
                                    `  ✗ Failed to parse ${listing.code} from ${source} (HTML length: ${html.length})`,
                                )
                            }
                        }
                    } else {
                        errors.push({
                            code: listing.code,
                            url: listing.viewUrl,
                            error: "Failed to fetch HTML from URL and no saved file found",
                        })
                        console.log(
                            `  ✗ Failed to fetch ${listing.code} from URL and no saved file`,
                        )
                    }
                } catch (error: any) {
                    errors.push({
                        code: listing.code,
                        url: listing.viewUrl,
                        error: error.message,
                    })
                    console.error(
                        `  ✗ Error processing ${listing.code}:`,
                        error.message,
                    )
                }

                // Add a small delay between requests to avoid overwhelming the server
                if (i < listings.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 500)) // 500ms delay
                }
            }

            // Merge with existing courses - prioritize detailed parsed courses
            const mergedCourses = [...existingCourses]
            let added = 0
            let updated = 0

            // First, add/update with detailed parsed courses (from fetched outlines)
            parsedCourses.forEach((detailedCourse) => {
                const existingIndex = mergedCourses.findIndex(
                    (c) =>
                        c.code === detailedCourse.code &&
                        c.term === detailedCourse.term,
                )

                if (existingIndex >= 0) {
                    // Update existing course with detailed information
                    mergedCourses[existingIndex] = {
                        ...mergedCourses[existingIndex],
                        ...detailedCourse,
                    }
                    updated++
                } else {
                    // Add new detailed course
                    mergedCourses.push(detailedCourse)
                    added++
                }
            })

            // Then, add any remaining courses from listings that weren't successfully fetched
            coursesFromListings.forEach((listingCourse) => {
                // Check if this course was already added from fetched outline
                const alreadyAdded = parsedCourses.some(
                    (c) =>
                        c.code === listingCourse.code &&
                        c.term === listingCourse.term,
                )

                if (!alreadyAdded) {
                    const existingIndex = mergedCourses.findIndex(
                        (c) =>
                            c.code === listingCourse.code &&
                            c.term === listingCourse.term,
                    )

                    if (existingIndex >= 0) {
                        // Update existing course with listing info if it doesn't have detailed info
                        const existing = mergedCourses[existingIndex]
                        if (
                            !existing.description ||
                            existing.description.includes(
                                "Detailed information will be available",
                            )
                        ) {
                            mergedCourses[existingIndex] = {
                                ...existing,
                                ...listingCourse,
                            }
                            updated++
                        }
                    } else {
                        // Add new course from listing (as fallback if fetch failed)
                        mergedCourses.push(listingCourse)
                        added++
                    }
                }
            })

            // Save merged courses
            writeFileSync(coursesPath, JSON.stringify(mergedCourses, null, 2))

            const totalAdded = added
            const totalUpdated = updated
            const successCount = parsedCourses.length
            const failedCount = errors.length

            const summaryMessage =
                successCount > 0
                    ? `Fetched and processed ${listings.length} course listings. Successfully added/updated ${successCount} courses with full details. ${totalAdded > 0 ? `Added ${totalAdded} new courses. ` : ""}${totalUpdated > 0 ? `Updated ${totalUpdated} existing courses. ` : ""}${failedCount > 0 ? `${failedCount} courses failed to fetch or parse.` : ""}`
                    : `Fetched ${listings.length} course listings but failed to process any courses. ${failedCount > 0 ? `Errors: ${failedCount} courses failed.` : "Please check the course URLs."}`

            return NextResponse.json({
                success: true,
                message: summaryMessage,
                listings,
                processed: parsedCourses.length,
                added: totalAdded,
                updated: totalUpdated,
                successCount,
                failedCount,
                errors: errors.length > 0 ? errors : undefined,
            })
        } else {
            // Process as a single course outline (existing functionality)
            const course = parseCourseOutline(html)

            if (!course) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to parse course outline. Please ensure the file is a valid course outline from outline.uwaterloo.ca",
                    },
                    { status: 400 },
                )
            }

            // Load existing courses
            const coursesPath = join(process.cwd(), "data", "courses.json")
            let existingCourses: Course[] = []

            try {
                const existingData = readFileSync(coursesPath, "utf8")
                existingCourses = JSON.parse(existingData)
            } catch (error) {
                console.log("No existing courses file found, creating new one")
            }

            // Check if course already exists
            const existingIndex = existingCourses.findIndex(
                (c) => c.code === course.code && c.term === course.term,
            )

            if (existingIndex >= 0) {
                existingCourses[existingIndex] = {
                    ...existingCourses[existingIndex],
                    ...course,
                }
            } else {
                existingCourses.push(course)
            }

            // Save updated courses
            writeFileSync(coursesPath, JSON.stringify(existingCourses, null, 2))

            return NextResponse.json({
                success: true,
                message: `Course ${course.code} ${existingIndex >= 0 ? "updated" : "added"} successfully`,
                course,
            })
        }
    } catch (error) {
        console.error("Error processing file:", error)
        return NextResponse.json(
            { success: false, error: "Failed to process file" },
            { status: 500 },
        )
    }
}
