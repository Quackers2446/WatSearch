import { NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import * as cheerio from "cheerio"
import { Course, Assessment, Material } from "@/types"
import { verifyAuthHeader } from "../auth"

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization")
        const uid = await verifyAuthHeader(authHeader)

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 },
            )
        }

        // Check if file is HTML
        if (!file.name.endsWith(".html")) {
            return NextResponse.json(
                { success: false, error: "File must be an HTML file" },
                { status: 400 },
            )
        }

        // Read file content
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const html = buffer.toString("utf8")

        // Parse the HTML
        const course = await parseCourseOutline(html)

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
            // Update existing course
            existingCourses[existingIndex] = {
                ...existingCourses[existingIndex],
                ...course,
            }
        } else {
            // Add new course
            existingCourses.push(course)
        }

        // Save updated courses
        writeFileSync(coursesPath, JSON.stringify(existingCourses, null, 2))

        return NextResponse.json({
            success: true,
            message: `Course ${course.code} ${existingIndex >= 0 ? "updated" : "added"} successfully`,
            course,
        })
    } catch (error) {
        console.error("Error processing upload:", error)
        return NextResponse.json(
            { success: false, error: "Failed to process file upload" },
            { status: 500 },
        )
    }
}

async function parseCourseOutline(html: string): Promise<Course | null> {
    try {
        const $ = cheerio.load(html)

        // Extract basic course info
        const courseCode = $(".outline-courses").text().trim()
        const term = $(".outline-term").text().trim()
        const title = $(".outline-title-full").text().trim()

        if (!courseCode || !title) {
            return null
        }

        // Extract sections
        const sections: string[] = []
        $(".section").each((_: number, el: cheerio.Element) => {
            sections.push($(el).text().trim())
        })

        // Extract instructor info
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

        // Extract schedule
        const scheduleDays: string[] = []
        $(".days-visual span.present").each(
            (_: number, el: cheerio.Element) => {
                scheduleDays.push($(el).text().trim().replace(",", ""))
            },
        )
        const scheduleTime = $("td")
            .filter(
                (_: number, el: cheerio.Element) =>
                    $(el).text().includes("PM") || $(el).text().includes("AM"),
            )
            .first()
            .text()
            .trim()
        const location = $("td")
            .filter(
                (_: number, el: cheerio.Element) =>
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
        const learningOutcomes: string[] = []
        $(
            "#learning_outcomes + .multitable-container .multitable tbody tr td",
        ).each((_: number, el: cheerio.Element) => {
            learningOutcomes.push($(el).text().trim())
        })

        // Extract assessments
        const assessments: Assessment[] = []
        $(
            "#assessments_amp_activities + .multitable-container .multitable tbody tr",
        ).each((_: number, el: cheerio.Element) => {
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

        // Extract materials
        const materials: Material[] = []
        $("#readings + .multitable-container .multitable tbody tr").each(
            (_: number, el: cheerio.Element) => {
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
        const policies: string[] = []
        $("#late_missed_content + .html-block p").each(
            (_: number, el: cheerio.Element) => {
                policies.push($(el).text().trim())
            },
        )

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
