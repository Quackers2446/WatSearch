/**
 * Firestore operations for course files using REST API (no Admin SDK required).
 * Uses user's ID token for authentication, same as firestore-server.ts
 */

import { IngestedCourseFile } from "./courseIngest";
import * as fs from "fs";
import * as path from "path";

// Firebase project ID
const FIREBASE_PROJECT_ID = "watsearch-a8c9b";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const STORAGE_BASE_URL = `https://storage.googleapis.com/upload/storage/v1/b/watsearch-a8c9b.firebasestorage.app/o`;

/**
 * Helper to convert any object/value to Firestore field format
 */
function valueToFirestoreField(value: any): any {
    if (value === undefined || value === null) {
        return { nullValue: null };
    }
    
    if (typeof value === "string") {
        return { stringValue: value };
    }
    
    if (typeof value === "number") {
        if (Number.isInteger(value)) {
            return { integerValue: value.toString() };
        } else {
            return { doubleValue: value };
        }
    }
    
    if (typeof value === "boolean") {
        return { booleanValue: value };
    }
    
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map((v) => valueToFirestoreField(v)),
            },
        };
    }
    
    if (typeof value === "object") {
        const fields: any = {};
        Object.entries(value).forEach(([key, val]) => {
            fields[key] = valueToFirestoreField(val);
        });
        return { mapValue: { fields } };
    }
    
    return { nullValue: null };
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
    const url = `${FIRESTORE_BASE_URL}${path}`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
    };

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firestore API error: ${response.status} ${error}`);
    }

    if (method === "DELETE" || response.status === 204) {
        return null;
    }

    return response.json();
}

/**
 * Upload a file to Firebase Storage using REST API with user's ID token.
 * 
 * NOTE: Firebase Storage REST API doesn't accept Firebase Auth ID tokens directly.
 * This function is currently disabled. To enable Storage uploads, you would need to:
 * 1. Use Firebase Admin SDK with service account (for server-side)
 * 2. Or implement client-side uploads using Firebase Storage SDK
 * 3. Or use signed URLs generated on the client
 * 
 * For now, we skip Storage uploads and only save metadata to Firestore.
 */
async function uploadFileToStorage(
    uid: string,
    courseId: string,
    relativePath: string,
    fullPath: string,
    idToken: string,
): Promise<string | null> {
    // Storage uploads are disabled because Firebase Storage REST API
    // doesn't accept Firebase Auth ID tokens. We only save metadata to Firestore.
    // Files can be uploaded to Storage later using client-side SDK or Admin SDK.
    console.log(`Skipping Storage upload for ${relativePath} (Storage uploads require different auth method)`);
    return null;
}

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
        ".pdf": "application/pdf",
        ".html": "text/html",
        ".htm": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xls": "application/vnd.ms-excel",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
        ".md": "text/markdown",
    };
    return contentTypes[ext] || "application/octet-stream";
}

/**
 * Find a course by code and term for a user.
 * Returns the course document ID if found.
 * 
 * @param uid - User ID
 * @param courseCode - Course code (e.g., "SE380", "SCI238")
 * @param term - Course term (optional, for more precise matching)
 * @param idToken - User's ID token
 * @returns Course document ID or null if not found
 */
export async function findCourseIdByCode(
    uid: string,
    courseCode: string,
    idToken: string,
    term?: string,
): Promise<string | null> {
    try {
        const coursesRef = `/users/${uid}/courses`;
        const response = await firestoreRequest("GET", coursesRef, idToken);
        
        if (!response.documents) {
            return null;
        }

        // Filter courses by code and optionally term
        const matchingCourse = response.documents.find((doc: any) => {
            const fields = doc.fields || {};
            const docCode = fields.code?.stringValue || "";
            const docTerm = fields.term?.stringValue || "";
            
            if (docCode !== courseCode) {
                return false;
            }
            
            if (term && docTerm !== term) {
                return false;
            }
            
            return true;
        });

        if (!matchingCourse) {
            return null;
        }

        // Extract document ID from the name path
        return matchingCourse.name?.split("/").pop() || null;
    } catch (error) {
        console.error("Error finding course:", error);
        return null;
    }
}

/**
 * Save or update course files in Firestore and upload to Firebase Storage.
 * Uses REST API with user's ID token (no Admin SDK required).
 * 
 * @param uid - User ID
 * @param courseId - Course document ID in Firestore
 * @param files - Array of ingested course files
 * @param idToken - User's ID token
 * @param uploadToStorage - Whether to upload files to Firebase Storage (default: true)
 * @returns Object with counts of added and updated files
 */
export async function saveCourseFiles(
    uid: string,
    courseId: string,
    files: IngestedCourseFile[],
    idToken: string,
    uploadToStorage: boolean = true,
): Promise<{ added: number; updated: number; uploaded: number }> {
    let added = 0;
    let updated = 0;
    let uploaded = 0;

    const filesRef = `/users/${uid}/courses/${courseId}/files`;

    for (const file of files) {
        try {
            // Sanitize relativePath to create a valid Firestore document ID
            const fileId = file.relativePath
                .replace(/\//g, "_")
                .replace(/\\/g, "_")
                .replace(/[^a-zA-Z0-9_-]/g, "_")
                .replace(/_+/g, "_")
                .replace(/^_|_$/g, "");

            const filePath = `${filesRef}/${fileId}`;

            // Check if file already exists
            let existingDoc: any = null;
            try {
                existingDoc = await firestoreRequest("GET", filePath, idToken);
            } catch (error: any) {
                // Document doesn't exist, which is fine
                if (!error.message?.includes("404") && !error.message?.includes("not found")) {
                    throw error;
                }
            }

            // Upload to Storage if requested and fullPath is available
            // NOTE: Currently disabled - Firebase Storage REST API doesn't accept Firebase Auth ID tokens
            // To enable: use Firebase Admin SDK or implement client-side uploads
            let storageUrl: string | null = null;
            if (uploadToStorage && file.fullPath && fs.existsSync(file.fullPath)) {
                // Skip Storage upload for now - Firebase Storage REST API requires OAuth2 tokens
                // which aren't available with Firebase Auth ID tokens
                // Options for future:
                // 1. Use Firebase Admin SDK with service account (requires credentials)
                // 2. Implement client-side uploads using Firebase Storage SDK
                // 3. Generate signed URLs on client and upload on server
                // For now, we'll just save the metadata without the storage URL
                // The file path is stored in relativePath, so users can upload files later if needed
            }

            const fileData: any = {
                courseId: { stringValue: file.courseId },
                relativePath: { stringValue: file.relativePath },
                filename: { stringValue: file.filename },
                category: { stringValue: file.category },
                updatedAt: { timestampValue: new Date().toISOString() },
            };

            // Add storage URL if available
            if (storageUrl) {
                fileData.storageUrl = { stringValue: storageUrl };
            }

            const body = { fields: fileData };

            if (existingDoc) {
                // Update existing file using PATCH
                const updateMask = Object.keys(fileData)
                    .map((field) => `updateMask.fieldPaths=${field}`)
                    .join("&");
                await firestoreRequest("PATCH", `${filePath}?${updateMask}`, idToken, body);
                updated++;
            } else {
                // Create new file - add createdAt
                fileData.createdAt = { timestampValue: new Date().toISOString() };
                body.fields = fileData;
                await firestoreRequest("PATCH", filePath, idToken, body);
                added++;
            }
        } catch (error) {
            console.error(`Error saving file ${file.relativePath}:`, error);
        }
    }

    return { added, updated, uploaded };
}

