const fs = require("fs")
const path = require("path")
const cheerio = require("cheerio")
const { parseCourseListings } = require("./parse-course-listings")

// Import the parse function (we'll need to adapt it)
function parseCourseOutline(html) {
    const $ = cheerio.load(html)

    // Extract basic course info
    const courseCode = $(".outline-courses").text().trim()
    const term = $(".outline-term").text().trim()
    const title = $(".outline-title-full").text().trim()

    if (!courseCode || !title) {
        return null
    }

    // Extract sections
    const sections = []
    $(".section").each((_, el) => {
        sections.push($(el).text().trim())
    })

    // Extract instructor info
    const instructorName = $(".instructor-info span").first().text().trim()
    const instructorEmail =
        $(".instructor-info small a")
            .first()
            .attr("href")
            ?.replace("mailto:", "") || ""
    const instructorOffice = $(".instructor-info").text().includes("Office:")
        ? $(".instructor-info")
              .text()
              .split("Office:")[1]
              ?.split("\n")[0]
              ?.trim()
        : undefined

    // Extract schedule
    const scheduleDays = []
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

    // Extract course description
    const description = $("#course_description")
        .nextAll(".dynamic-component, .html-block")
        .first()
        .text()
        .trim()

    // Extract learning outcomes
    const learningOutcomes = []
    $(
        "#learning_outcomes + .multitable-container .multitable tbody tr td",
    ).each((_, el) => {
        learningOutcomes.push($(el).text().trim())
    })

    // Extract assessments
    const assessments = []
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
                let dueDate = undefined
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

    // Extract materials
    const materials = []
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

    // Extract policies
    const policies = []
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
}

/**
 * Process all course outlines from downloaded HTML files
 */
function batchProcessOutlines() {
    const courseOutlinesDir = path.join(__dirname, "../course-outlines")
    const coursesPath = path.join(__dirname, "../data/courses.json")

    // Load existing courses
    let existingCourses = []
    if (fs.existsSync(coursesPath)) {
        try {
            const existingData = fs.readFileSync(coursesPath, "utf8")
            existingCourses = JSON.parse(existingData)
        } catch (error) {
            console.error("Error loading existing courses:", error)
        }
    }

    // Find all HTML files in course-outlines directory (excluding the listings file)
    const files = fs
        .readdirSync(courseOutlinesDir)
        .filter(
            (file) =>
                file.endsWith(".html") && file !== "Outline.uwaterloo.ca.html",
        )
        .map((file) => path.join(courseOutlinesDir, file))

    console.log(`Found ${files.length} course outline files to process\n`)

    const parsedCourses = []
    const errors = []

    files.forEach((filePath, index) => {
        const fileName = path.basename(filePath)
        console.log(`[${index + 1}/${files.length}] Processing ${fileName}...`)

        try {
            const html = fs.readFileSync(filePath, "utf8")
            const course = parseCourseOutline(html)

            if (course) {
                parsedCourses.push(course)
                console.log(
                    `  ✓ Parsed: ${course.code} - ${course.name} (${course.term})`,
                )
            } else {
                errors.push({
                    file: fileName,
                    error: "Failed to parse course outline",
                })
                console.log(`  ✗ Failed to parse`)
            }
        } catch (error) {
            errors.push({ file: fileName, error: error.message })
            console.log(`  ✗ Error: ${error.message}`)
        }
    })

    // Merge with existing courses
    const mergedCourses = [...existingCourses]

    parsedCourses.forEach((newCourse) => {
        const existingIndex = mergedCourses.findIndex(
            (c) => c.code === newCourse.code && c.term === newCourse.term,
        )

        if (existingIndex >= 0) {
            // Update existing course
            mergedCourses[existingIndex] = {
                ...mergedCourses[existingIndex],
                ...newCourse,
            }
            console.log(`  Updated: ${newCourse.code} ${newCourse.term}`)
        } else {
            // Add new course
            mergedCourses.push(newCourse)
            console.log(`  Added: ${newCourse.code} ${newCourse.term}`)
        }
    })

    // Save merged courses
    fs.writeFileSync(coursesPath, JSON.stringify(mergedCourses, null, 2))

    console.log(`\n=== Summary ===`)
    console.log(`Successfully parsed: ${parsedCourses.length} courses`)
    console.log(`Errors: ${errors.length}`)
    console.log(`Total courses in database: ${mergedCourses.length}`)

    if (errors.length > 0) {
        console.log(`\nErrors:`)
        errors.forEach(({ file, error }) => {
            console.log(`  ${file}: ${error}`)
        })
    }

    console.log(`\nCourses saved to: ${coursesPath}`)
}

if (require.main === module) {
    batchProcessOutlines()
}

module.exports = { batchProcessOutlines, parseCourseOutline }
