import { NextRequest, NextResponse } from "next/server"
import { verifyAuthHeader } from "../../../auth"

const FIREBASE_PROJECT_ID = "watsearch-a8c9b"
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`

async function firestoreRequest(
    method: string,
    path: string,
    idToken: string,
): Promise<any> {
    const url = `${FIRESTORE_BASE_URL}${path}`
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
    })

    if (!response.ok) {
        if (response.status === 404) {
            return null
        }
        const error = await response.text()
        throw new Error(`Firestore API error: ${response.status} ${error}`)
    }

    return response.json()
}

export async function GET(
    request: NextRequest,
    { params }: { params: { courseId: string } },
) {
    try {
        const authHeader = request.headers.get("Authorization")
        const uid = await verifyAuthHeader(authHeader)
        const idToken = authHeader?.replace(/^Bearer\s+/i, "").trim() || ""

        const { courseId } = params

        // Get files from Firestore
        const filesPath = `/users/${uid}/courses/${courseId}/files`
        const response = await firestoreRequest("GET", filesPath, idToken)

        if (!response || !response.documents) {
            return NextResponse.json({
                success: true,
                files: [],
            })
        }

        // Convert Firestore documents to file metadata
        const files = response.documents.map((doc: any) => {
            const fields = doc.fields || {}
            const getValue = (field: any): any => {
                if (!field) return undefined
                if (field.stringValue !== undefined) return field.stringValue
                if (field.timestampValue !== undefined)
                    return field.timestampValue
                return undefined
            }

            return {
                courseId: getValue(fields.courseId) || courseId,
                relativePath: getValue(fields.relativePath) || "",
                filename: getValue(fields.filename) || "",
                category: getValue(fields.category) || "misc",
                createdAt: getValue(fields.createdAt),
                updatedAt: getValue(fields.updatedAt),
            }
        })

        return NextResponse.json({
            success: true,
            files,
        })
    } catch (error: any) {
        console.error("Error fetching course files:", error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to fetch course files",
                files: [],
            },
            { status: 500 },
        )
    }
}

