import { NextRequest, NextResponse } from "next/server"
import { writeFileSync, readFileSync } from "fs"
import { join } from "path"
import { firestore } from "@/lib/firebase"
import { verifyAuthHeader } from "../auth"

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization")
        const uid = await verifyAuthHeader(authHeader)

        const data = await request.json()
        console.log("WatSearch API: Received course data:", data)

        // Process the incoming data
        const processedData = processCourseData(data)

        // Load existing courses
        const coursesPath = join(process.cwd(), "data", "courses.json")
        let existingCourses = []

        try {
            const existingData = readFileSync(coursesPath, "utf8")
            existingCourses = JSON.parse(existingData)
        } catch (error) {
            console.log("No existing courses file found, creating new one")
        }

        // Merge with existing data
        const updatedCourses = mergeCourseData(existingCourses, processedData)

        // Save updated courses
        writeFileSync(coursesPath, JSON.stringify(updatedCourses, null, 2))

        console.log("WatSearch API: Course data saved successfully")

        return NextResponse.json(
            {
                success: true,
                message: "Course data received and processed successfully",
                coursesCount: updatedCourses.length,
            },
            {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods":
                        "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers":
                        "Content-Type, Authorization",
                },
            },
        )
    } catch (error) {
        console.error("WatSearch API: Error processing course data:", error)
        return NextResponse.json(
            { success: false, error: "Failed to process course data" },
            {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods":
                        "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers":
                        "Content-Type, Authorization",
                },
            },
        )
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    })
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization")
        const uid = await verifyAuthHeader(authHeader)

        const coursesPath = join(process.cwd(), "data", "courses.json")
        const coursesData = readFileSync(coursesPath, "utf8")
        const courses = JSON.parse(coursesData)

        return NextResponse.json(
            {
                success: true,
                courses,
                count: courses.length,
            },
            {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods":
                        "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers":
                        "Content-Type, Authorization",
                },
            },
        )
    } catch (error) {
        console.error("Error loading courses:", error)
        return NextResponse.json(
            { success: false, error: "Failed to load courses" },
            {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods":
                        "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers":
                        "Content-Type, Authorization",
                },
            },
        )
    }
}

function processCourseData(data: any) {
    const processedCourses = []

    // Process LEARN data
    if (data.site === "LEARN" && data.data.courses) {
        data.data.courses.forEach((course: any) => {
            processedCourses.push({
                id: course.id || `learn-${Date.now()}`,
                code: course.code || "Unknown",
                name: course.name || "Unknown Course",
                term: course.term || "Fall 2025",
                source: "LEARN",
                instructor: {
                    name: course.instructor || "TBA",
                },
                schedule: {
                    days: [],
                    time: "",
                    location: "",
                },
                description: "Course imported from LEARN",
                learningOutcomes: [],
                assessments: data.data.assignments || [],
                materials: [],
                policies: [],
                url: course.url,
                lastUpdated: new Date().toISOString(),
            })
        })
    }

    // Process Quest data
    if (data.site === "Quest" && data.data.courses) {
        data.data.courses.forEach((course: any) => {
            processedCourses.push({
                id: course.id || `quest-${Date.now()}`,
                code: course.code || "Unknown",
                name: course.name || "Unknown Course",
                term: course.term || "Fall 2025",
                source: "Quest",
                instructor: {
                    name: "TBA",
                },
                schedule: {
                    days: [],
                    time: "",
                    location: "",
                },
                description: "Course imported from Quest",
                learningOutcomes: [],
                assessments: [],
                materials: [],
                policies: [],
                credits: course.credits,
                url: course.url,
                lastUpdated: new Date().toISOString(),
            })
        })
    }

    // Process Piazza data
    if (data.site === "Piazza" && data.data.posts) {
        // Create a course entry for Piazza discussions
        processedCourses.push({
            id: `piazza-${Date.now()}`,
            code: "Piazza Discussions",
            name: "Course Discussions",
            term: "Fall 2025",
            source: "Piazza",
            instructor: {
                name: "TBA",
            },
            schedule: {
                days: [],
                time: "",
                location: "",
            },
            description: "Discussion posts imported from Piazza",
            learningOutcomes: [],
            assessments: [],
            materials: [],
            policies: [],
            discussions: data.data.posts,
            lastUpdated: new Date().toISOString(),
        })
    }

    return processedCourses
}

function mergeCourseData(existingCourses: any[], newCourses: any[]) {
    const merged = [...existingCourses]

    newCourses.forEach((newCourse) => {
        // Check if course already exists
        const existingIndex = merged.findIndex(
            (course) =>
                course.code === newCourse.code &&
                course.term === newCourse.term,
        )

        if (existingIndex >= 0) {
            // Update existing course
            merged[existingIndex] = {
                ...merged[existingIndex],
                ...newCourse,
                lastUpdated: new Date().toISOString(),
            }
        } else {
            // Add new course
            merged.push(newCourse)
        }
    })

    return merged
}
