import { NextRequest, NextResponse } from "next/server"
import { verifyAuthHeader } from "../auth"
import { findCourseIdByCode, saveCourseFiles } from "@/lib/firestore-course-files-server"
import { ingestCourseFolder } from "@/lib/courseIngest"
import AdmZip from "adm-zip"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"

export async function POST(request: NextRequest) {
    let tempDir: string | null = null

    try {
        const authHeader = request.headers.get("Authorization")
        const uid = await verifyAuthHeader(authHeader)
        const idToken = authHeader?.replace(/^Bearer\s+/i, "").trim() || ""

        const formData = await request.formData()
        const zipFile = formData.get("zipFile") as File
        const courseCode = formData.get("courseCode") as string
        const courseId = formData.get("courseId") as string | null
        const term = formData.get("term") as string | null

        if (!zipFile) {
            return NextResponse.json(
                { success: false, error: "No zip file provided" },
                { status: 400 },
            )
        }

        if (!courseCode && !courseId) {
            return NextResponse.json(
                { success: false, error: "Course code or ID is required" },
                { status: 400 },
            )
        }

        // Check if file is a zip
        if (!zipFile.name.endsWith(".zip")) {
            return NextResponse.json(
                { success: false, error: "File must be a ZIP archive" },
                { status: 400 },
            )
        }

        // Create temporary directory for extraction
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "course-materials-"))

        // Save uploaded zip to temp file
        const zipBuffer = Buffer.from(await zipFile.arrayBuffer())
        const zipPath = path.join(tempDir, zipFile.name)
        fs.writeFileSync(zipPath, zipBuffer)

        // Extract zip file
        const zip = new AdmZip(zipPath)
        const extractPath = path.join(tempDir, "extracted")
        zip.extractAllTo(extractPath, true)

        // Find the root course folder (could be directly in extracted or one level deep)
        let courseFolderPath = extractPath
        const extractedContents = fs.readdirSync(extractPath)
        
        // If there's only one item and it's a directory, use that as the root
        if (extractedContents.length === 1) {
            const firstItem = path.join(extractPath, extractedContents[0])
            if (fs.statSync(firstItem).isDirectory()) {
                courseFolderPath = firstItem
            }
        }

        // Determine course document ID
        let finalCourseId: string
        if (courseId) {
            finalCourseId = courseId
        } else {
            // Find course by code
            const foundCourseId = await findCourseIdByCode(uid, courseCode, idToken, term || undefined)
            if (!foundCourseId) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Course "${courseCode}" not found. Please ensure the course exists in your account.`,
                    },
                    { status: 404 },
                )
            }
            finalCourseId = foundCourseId
        }

        // Ingest the course folder
        const files = await ingestCourseFolder(courseCode, courseFolderPath)

        if (files.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No files found in the uploaded archive",
                },
                { status: 400 },
            )
        }

        // Read file contents and prepare for IndexedDB storage
        const filesWithData = await Promise.all(
            files.map(async (file) => {
                if (!file.fullPath || !fs.existsSync(file.fullPath)) {
                    return null;
                }

                try {
                    const fileContent = fs.readFileSync(file.fullPath);
                    const base64Data = fileContent.toString("base64");
                    
                    // Get content type
                    const ext = path.extname(file.relativePath).toLowerCase();
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
                        ".txt": "text/plain",
                        ".md": "text/markdown",
                    };
                    const contentType = contentTypes[ext] || "application/octet-stream";

                    return {
                        ...file,
                        data: base64Data,
                        contentType,
                    };
                } catch (error) {
                    console.error(`Error reading file ${file.relativePath}:`, error);
                    return null;
                }
            })
        );

        // Filter out nulls (files that couldn't be read)
        const validFiles = filesWithData.filter((f) => f !== null) as Array<
            typeof files[0] & { data: string; contentType: string }
        >;

        // Save metadata to Firestore
        const result = await saveCourseFiles(uid, finalCourseId, files, idToken, false)

        // Clean up temp directory
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }

        return NextResponse.json({
            success: true,
            message: `Successfully processed ${files.length} files`,
            result: {
                totalFiles: files.length,
                added: result.added,
                updated: result.updated,
                uploaded: result.uploaded,
            },
            // Return file data for IndexedDB storage
            files: validFiles.map((file) => ({
                courseId: file.courseId,
                relativePath: file.relativePath,
                filename: file.filename,
                category: file.category,
                data: file.data, // base64 encoded
                contentType: file.contentType,
            })),
            courseId: finalCourseId,
        })
    } catch (error: any) {
        // Clean up temp directory on error
        if (tempDir && fs.existsSync(tempDir)) {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true })
            } catch (cleanupError) {
                console.error("Error cleaning up temp directory:", cleanupError)
            }
        }

        console.error("Error processing course materials upload:", error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to process course materials upload",
            },
            { status: 500 },
        )
    }
}

