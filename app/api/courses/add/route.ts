import { NextRequest, NextResponse } from "next/server"
import { verifyAuthHeader } from "../../auth"
import { saveUserCourse } from "@/lib/firestore-server"
import { Course } from "@/types"
import { courses as allCourses, coursesInitialized } from "@/app/courses/courses"
import { convertOutlineToCourse } from "@/lib/courseOutlineConverter"

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization")
        const uid = await verifyAuthHeader(authHeader)
        const idToken = authHeader?.replace(/^Bearer\s+/i, "").trim() || ""
        
        const data = await request.json()
        const courseId = data.courseId // This is the outline ID
        
        if (!courseId) {
            return NextResponse.json(
                { success: false, error: "Course ID is required" },
                { status: 400 }
            )
        }
        
        // Wait for courses to be initialized
        await coursesInitialized
        
        // Find the outline course
        // allCourses is an object with course IDs as keys
        const outlineCourse = allCourses[courseId] || Object.values(allCourses).find(
            (c: any) => c.id === parseInt(courseId) || String(c.id) === courseId
        )
        
        if (!outlineCourse) {
            return NextResponse.json(
                { success: false, error: "Course not found" },
                { status: 404 }
            )
        }
        
        // Convert to Course type
        const course = convertOutlineToCourse(outlineCourse)
        
        // Allow term override if provided
        if (data.term) {
            course.term = data.term
        }
        
        // Save to user's courses
        const savedCourse = await saveUserCourse(uid, course, idToken)
        
        return NextResponse.json(
            {
                success: true,
                course: savedCourse,
                message: "Course added successfully",
            },
            {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
            }
        )
    } catch (error: any) {
        console.error("Error adding course:", error)
        return NextResponse.json(
            { success: false, error: error.message || "Failed to add course" },
            {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
            }
        )
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    })
}

