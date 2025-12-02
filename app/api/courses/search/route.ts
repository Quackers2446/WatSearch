import { NextRequest, NextResponse } from "next/server"
import { courses as allCourses, coursesInitialized } from "@/app/courses/courses"
import { convertOutlineToCourse } from "@/lib/courseOutlineConverter"
import { Course } from "@/types"

export async function GET(request: NextRequest) {
    try {
        // Wait for courses to be initialized
        await coursesInitialized
        
        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get("q") || ""
        const limit = parseInt(searchParams.get("limit") || "50")
        const offset = parseInt(searchParams.get("offset") || "0")
        
        // Convert all outline courses to Course type
        // allCourses is an object with course IDs as keys (from courses.ts)
        const convertedCourses: Course[] = []
        const coursesArray = Object.values(allCourses)
        
        for (const outline of coursesArray) {
            // Skip invalid entries - must have content property
            if (!outline || typeof outline !== "object" || !outline.content) {
                continue
            }
            
            try {
                const course = convertOutlineToCourse(outline)
                convertedCourses.push(course)
            } catch (error: any) {
                // Silently skip invalid courses - they're likely malformed data
                // Only log if it's not a validation error
                if (!error?.message?.includes("Invalid course outline")) {
                    console.error(`Error converting course ${outline?.id || "unknown"}:`, error?.message || error)
                }
            }
        }
        
        // Filter by search query
        let filteredCourses = convertedCourses
        if (query) {
            const lowerQuery = query.toLowerCase().trim()
            // Split query into words for whole-word matching
            const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0)
            
            // Create regex patterns for whole-word matching
            const patterns = queryWords.map(word => {
                // Escape special regex characters
                const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                // Match whole words only (word boundaries)
                return new RegExp(`\\b${escaped}\\b`, 'i')
            })
            
            filteredCourses = convertedCourses.filter((course) => {
                // For course code, allow partial matching (e.g., "CS 350" should match "CS350")
                const codeMatch = course.code.toLowerCase().replace(/\s+/g, '').includes(lowerQuery.replace(/\s+/g, ''))
                
                // For other fields, use whole-word matching
                const nameMatch = patterns.some(pattern => pattern.test(course.name.toLowerCase()))
                const descriptionMatch = patterns.some(pattern => pattern.test(course.description.toLowerCase()))
                const instructorMatch = patterns.some(pattern => pattern.test(course.instructor.name.toLowerCase()))
                const outcomesMatch = course.learningOutcomes.some((outcome) =>
                    patterns.some(pattern => pattern.test(outcome.toLowerCase()))
                )
                
                return codeMatch || nameMatch || descriptionMatch || instructorMatch || outcomesMatch
            })
        }
        
        // Sort by course code
        filteredCourses.sort((a, b) => a.code.localeCompare(b.code))
        
        // Apply pagination
        const paginatedCourses = filteredCourses.slice(offset, offset + limit)
        
        return NextResponse.json(
            {
                success: true,
                courses: paginatedCourses,
                total: filteredCourses.length,
                limit,
                offset,
            },
            {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
            }
        )
    } catch (error) {
        console.error("Error searching courses:", error)
        return NextResponse.json(
            { success: false, error: "Failed to search courses" },
            {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
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
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    })
}

