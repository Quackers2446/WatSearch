import * as fs from "fs"
import * as path from "path"
import * as cheerio from "cheerio"
import { Course } from "../types"

interface CourseListing {
    code: string
    title: string
    term: string
    sections: string[]
    viewUrl: string
    outlineId: string // The ID from the URL (e.g., 'nc7p8w' from '/viewer/view/nc7p8w')
}

/**
 * Parse the course listings HTML file to extract all courses with their View links
 */
export function parseCourseListings(htmlFilePath: string): CourseListing[] {
    const html = fs.readFileSync(htmlFilePath, "utf8")
    const $ = cheerio.load(html)
    const courses: CourseListing[] = []

    // Find all term sections (e.g., "Fall 2025", "Spring 2025")
    $("h3.text-xl").each((_, header) => {
        const term = $(header).text().trim()

        // Find the table that follows this header
        const table = $(header).closest("div.border").find("table tbody")

        table.find("tr").each((_, row) => {
            const cells = $(row).find("td")

            if (cells.length >= 4) {
                // Extract course code
                const code = cells.eq(0).find("span").text().trim()

                // Extract course title (may be hidden on mobile)
                const title = cells.eq(1).text().trim()

                // Extract sections
                const sectionsText = cells.eq(2).text().trim()
                const sections = sectionsText.split(",").map((s) => s.trim())

                // Extract View link
                const viewLink = cells
                    .eq(3)
                    .find('a[href*="/viewer/view/"]')
                    .attr("href")

                if (code && viewLink) {
                    // Extract the outline ID from the URL
                    const outlineIdMatch = viewLink.match(
                        /\/viewer\/view\/([^/]+)/,
                    )
                    const outlineId = outlineIdMatch ? outlineIdMatch[1] : ""

                    // Get full URL
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
 * Generate a script to download all course outlines
 */
export function generateDownloadScript(courses: CourseListing[]): string {
    const script = courses
        .map((course, index) => {
            return `# ${course.code} - ${course.title} (${course.term})
# Sections: ${course.sections.join(", ")}
# URL: ${course.viewUrl}
# To download: Open ${course.viewUrl} in browser, then File > Save Page As > "${course.code}_${course.term.replace(/\s+/g, "_")}_${course.outlineId}.html"
`
        })
        .join("\n")

    return script
}

/**
 * Main function to process the course listings file
 */
async function main() {
    const listingsFilePath = path.join(
        __dirname,
        "../course-outlines/Outline.uwaterloo.ca.html",
    )

    if (!fs.existsSync(listingsFilePath)) {
        console.error(`File not found: ${listingsFilePath}`)
        process.exit(1)
    }

    console.log("Parsing course listings...")
    const courses = parseCourseListings(listingsFilePath)

    console.log(`\nFound ${courses.length} courses:\n`)

    // Group by term
    const coursesByTerm = courses.reduce(
        (acc, course) => {
            if (!acc[course.term]) {
                acc[course.term] = []
            }
            acc[course.term].push(course)
            return acc
        },
        {} as Record<string, CourseListing[]>,
    )

    // Display summary
    Object.entries(coursesByTerm).forEach(([term, termCourses]) => {
        console.log(`${term}: ${termCourses.length} courses`)
        termCourses.forEach((course) => {
            console.log(`  - ${course.code}: ${course.title}`)
            console.log(`    Sections: ${course.sections.join(", ")}`)
            console.log(`    View: ${course.viewUrl}`)
        })
        console.log()
    })

    // Save the course listings as JSON
    const outputPath = path.join(__dirname, "../data/course-listings.json")
    fs.writeFileSync(outputPath, JSON.stringify(courses, null, 2))
    console.log(`\nCourse listings saved to: ${outputPath}`)

    // Generate download instructions
    const downloadScript = generateDownloadScript(courses)
    const scriptPath = path.join(__dirname, "../scripts/download-outlines.sh")
    fs.writeFileSync(scriptPath, downloadScript)
    console.log(`Download instructions saved to: ${scriptPath}`)

    // Also create a JSON file with just the URLs for easy programmatic access
    const urlsPath = path.join(__dirname, "../data/course-urls.json")
    const urls = courses.map((c) => ({
        code: c.code,
        title: c.title,
        term: c.term,
        url: c.viewUrl,
        outlineId: c.outlineId,
    }))
    fs.writeFileSync(urlsPath, JSON.stringify(urls, null, 2))
    console.log(`Course URLs saved to: ${urlsPath}`)
}

if (require.main === module) {
    main().catch(console.error)
}
