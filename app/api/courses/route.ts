import { NextRequest, NextResponse } from "next/server"
import { verifyAuthHeader } from "../auth"
import {
    getUserCourses,
    saveUserCourses,
    findUserCourseByCodeAndTerm,
} from "@/lib/firestore-server"
import { Course } from "@/types"

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization")
        const uid = await verifyAuthHeader(authHeader)
        const idToken = authHeader?.replace(/^Bearer\s+/i, "").trim() || ""

        const data = await request.json()
        console.log("WatSearch API: Received course data:", data)

        // Process the incoming data
        const processedData = processCourseData(data)

        // Save courses to Firestore for this user
        const result = await saveUserCourses(uid, processedData, idToken)

        console.log("WatSearch API: Course data saved successfully")

        return NextResponse.json(
            {
                success: true,
                message: "Course data received and processed successfully",
                coursesCount: processedData.length,
                added: result.added,
                updated: result.updated,
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
        const idToken = authHeader?.replace(/^Bearer\s+/i, "").trim() || ""

        // Get courses from Firestore for this user
        const courses = await getUserCourses(uid, idToken)

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

function processCourseData(data: any): Course[] {
    const processedCourses: Course[] = []

    // Process LEARN data
    if (data.site === "LEARN" && data.data.courses) {
        data.data.courses.forEach((course: any) => {
            processedCourses.push({
                id: course.id || `learn-${Date.now()}`,
                code: course.code || "Unknown",
                name: course.name || "Unknown Course",
                term: course.term || "Fall 2025",
                instructor: {
                    name: course.instructor || "TBA",
                    email: "",
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
            } as Course)
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
                instructor: {
                    name: "TBA",
                    email: "",
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
            } as Course)
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
            instructor: {
                name: "TBA",
                email: "",
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
        } as Course)
    }

    return processedCourses
}

