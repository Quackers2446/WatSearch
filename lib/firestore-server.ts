import { Course } from "@/types"

// Firebase project ID
const FIREBASE_PROJECT_ID = "watsearch-a8c9b"
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`

/**
 * Helper to convert Firestore document to Course
 */
function documentToCourse(doc: any): Course {
    const fields = doc.fields || {}
    
    // Helper to extract field values
    const getValue = (field: any): any => {
        if (!field) return undefined
        if (field.stringValue !== undefined) return field.stringValue
        if (field.integerValue !== undefined) return parseInt(field.integerValue)
        if (field.doubleValue !== undefined) return parseFloat(field.doubleValue)
        if (field.booleanValue !== undefined) return field.booleanValue
        if (field.arrayValue) {
            return field.arrayValue.values?.map((v: any) => getValue(v)) || []
        }
        if (field.mapValue) {
            const map: any = {}
            Object.entries(field.mapValue.fields || {}).forEach(([key, value]: [string, any]) => {
                map[key] = getValue(value)
            })
            return map
        }
        return undefined
    }

    return {
        id: doc.name?.split("/").pop() || "",
        code: getValue(fields.code) || "",
        name: getValue(fields.name) || "",
        term: getValue(fields.term) || "",
        sections: getValue(fields.sections) || [],
        instructor: getValue(fields.instructor) || { name: "TBA", email: "" },
        schedule: getValue(fields.schedule) || { days: [], time: "", location: "" },
        description: getValue(fields.description) || "",
        learningOutcomes: getValue(fields.learningOutcomes) || [],
        assessments: getValue(fields.assessments) || [],
        materials: getValue(fields.materials) || [],
        policies: getValue(fields.policies) || [],
    } as Course
}

/**
 * Helper to convert any object/value to Firestore field format
 */
function valueToFirestoreField(value: any): any {
    if (value === undefined || value === null) {
        return { nullValue: null }
    }
    
    if (typeof value === "string") {
        return { stringValue: value }
    }
    
    if (typeof value === "number") {
        if (Number.isInteger(value)) {
            return { integerValue: value.toString() }
        } else {
            return { doubleValue: value }
        }
    }
    
    if (typeof value === "boolean") {
        return { booleanValue: value }
    }
    
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map((v) => valueToFirestoreField(v)),
            },
        }
    }
    
    if (typeof value === "object") {
        const fields: any = {}
        Object.entries(value).forEach(([key, val]) => {
            fields[key] = valueToFirestoreField(val)
        })
        return { mapValue: { fields } }
    }
    
    return { nullValue: null }
}

/**
 * Helper to convert Course to Firestore document format
 */
function courseToFields(course: Course): any {
    const fields: any = {}
    
    // Don't include id in fields (it's the document name)
    const { id, ...courseData } = course
    
    Object.entries(courseData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            fields[key] = valueToFirestoreField(value)
        }
    })

    return fields
}

/**
 * Make authenticated Firestore REST API request
 */
async function firestoreRequest(
    method: string,
    path: string,
    idToken: string,
    body?: any,
): Promise<any> {
    const url = `${FIRESTORE_BASE_URL}${path}`
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Firestore API error: ${response.status} ${error}`)
    }

    if (method === "DELETE" || response.status === 204) {
        return null
    }

    return response.json()
}

/**
 * Get all courses for a specific user
 */
export async function getUserCourses(uid: string, idToken: string): Promise<Course[]> {
    try {
        const path = `/users/${uid}/courses`
        const response = await firestoreRequest("GET", path, idToken)
        
        if (!response.documents) {
            return []
        }

        return response.documents.map((doc: any) => documentToCourse(doc))
    } catch (error) {
        console.error("Error fetching user courses:", error)
        return []
    }
}

/**
 * Get a specific course for a user
 */
export async function getUserCourse(
    uid: string,
    courseId: string,
    idToken: string,
): Promise<Course | null> {
    try {
        const path = `/users/${uid}/courses/${courseId}`
        const response = await firestoreRequest("GET", path, idToken)
        return documentToCourse(response)
    } catch (error: any) {
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            return null
        }
        console.error("Error fetching user course:", error)
        return null
    }
}

/**
 * Find a course by code and term for a user
 */
export async function findUserCourseByCodeAndTerm(
    uid: string,
    code: string,
    term: string,
    idToken: string,
): Promise<Course | null> {
    try {
        // Firestore REST API doesn't support queries directly in the same way
        // We'll get all courses and filter client-side
        const courses = await getUserCourses(uid, idToken)
        return courses.find((c) => c.code === code && c.term === term) || null
    } catch (error) {
        console.error("Error finding user course:", error)
        return null
    }
}

/**
 * Generate a unique document ID
 */
function generateDocumentId(): string {
    // Generate a random ID similar to Firestore's auto-generated IDs
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * Save or update a course for a user
 */
export async function saveUserCourse(
    uid: string,
    course: Course,
    idToken: string,
): Promise<Course> {
    try {
        // Check if course already exists
        const existingCourse = await findUserCourseByCodeAndTerm(
            uid,
            course.code,
            course.term,
            idToken,
        )

        const courseId = existingCourse?.id || course.id || generateDocumentId()
        const path = `/users/${uid}/courses/${courseId}`

        const fields = courseToFields(course)
        const body = { fields }

        let response: any
        if (existingCourse) {
            // Update existing document using PATCH
            // Build update mask for all fields
            const updateMask = Object.keys(fields)
                .map((field) => `updateMask.fieldPaths=${field}`)
                .join("&")
            response = await firestoreRequest(
                "PATCH",
                `${path}?${updateMask}`,
                idToken,
                body,
            )
        } else {
            // Create new document using PATCH with currentTimestamp
            // Firestore REST API: Use PATCH to create if document doesn't exist
            response = await firestoreRequest("PATCH", path, idToken, body)
        }

        const savedDoc = response || { name: path }
        const savedId = savedDoc.name?.split("/").pop() || courseId

        return {
            ...course,
            id: savedId,
        } as Course
    } catch (error) {
        console.error("Error saving user course:", error)
        throw error
    }
}

/**
 * Save multiple courses for a user
 */
export async function saveUserCourses(
    uid: string,
    courses: Course[],
    idToken: string,
): Promise<{ added: number; updated: number }> {
    let added = 0
    let updated = 0

    for (const course of courses) {
        try {
            const existingCourse = await findUserCourseByCodeAndTerm(
                uid,
                course.code,
                course.term,
                idToken,
            )

            if (existingCourse) {
                updated++
            } else {
                added++
            }

            await saveUserCourse(uid, course, idToken)
        } catch (error) {
            console.error(`Error saving course ${course.code}:`, error)
        }
    }

    return { added, updated }
}

/**
 * Delete a course for a user
 */
export async function deleteUserCourse(
    uid: string,
    courseId: string,
    idToken: string,
): Promise<boolean> {
    try {
        const path = `/users/${uid}/courses/${courseId}`
        await firestoreRequest("DELETE", path, idToken)
        return true
    } catch (error) {
        console.error("Error deleting user course:", error)
        return false
    }
}
