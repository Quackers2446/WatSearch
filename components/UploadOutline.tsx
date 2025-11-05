"use client"

import { useState, useRef } from "react"
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    Info,
    ExternalLink,
    Download,
    RefreshCw,
} from "lucide-react"
import { AuthContext } from "@/app/auth"
import { useContext } from "react"

interface CourseListing {
    code: string
    title: string
    term: string
    sections: string[]
    viewUrl: string
    outlineId: string
}

interface FileUploadStatus {
    file: File
    status: "pending" | "uploading" | "success" | "error"
    message?: string
    course?: { code: string; term: string }
}

export default function UploadOutline() {
    const [files, setFiles] = useState<File[]>([])
    const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<{
        type: "success" | "error" | null
        message: string
    }>({ type: null, message: "" })
    const [showInstructions, setShowInstructions] = useState(true)
    const [isListingsFile, setIsListingsFile] = useState(false)
    const [listings, setListings] = useState<CourseListing[]>([])
    const [showListings, setShowListings] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const user = useContext(AuthContext)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        if (selectedFiles.length === 0) return

        // Filter to only HTML files
        const htmlFiles = selectedFiles.filter((file) =>
            file.name.endsWith(".html"),
        )

        if (htmlFiles.length === 0) {
            setUploadStatus({
                type: "error",
                message: "Please select HTML files only",
            })
            return
        }

        if (htmlFiles.length !== selectedFiles.length) {
            setUploadStatus({
                type: "error",
                message: `Only ${htmlFiles.length} of ${selectedFiles.length} files are HTML files. Non-HTML files were ignored.`,
            })
        }

        // Check if any file is a listings file
        const listingsFile = htmlFiles.find((file) =>
            file.name.includes("Outline.uwaterloo.ca"),
        )
        const isListings = !!listingsFile
        setIsListingsFile(isListings)

        setFiles(htmlFiles)
        setFileStatuses(
            htmlFiles.map((file) => ({
                file,
                status: "pending" as const,
            })),
        )
        setUploadStatus({ type: null, message: "" })

        // If there's a listings file, preview it
        if (listingsFile) {
            const reader = new FileReader()
            reader.onload = async (event) => {
                const html = event.target?.result as string

                if (
                    html.includes("Browse Outlines") ||
                    html.includes("My Enrolled Courses")
                ) {
                    const formData = new FormData()
                    formData.append("file", listingsFile)
                    formData.append("action", "parse_only")

                    try {
                        if (!user) {
                            return
                        }
                        const idToken = await user.getIdToken()
                        const response = await fetch("/api/process-listings", {
                            method: "POST",
                            body: formData,
                            headers: {
                                Authorization: `Bearer ${idToken}`,
                            },
                        })

                        const data = await response.json()
                        if (data.success && data.listings) {
                            setListings(data.listings)
                            setShowListings(true)
                        }
                    } catch (error) {
                        console.error("Error previewing listings:", error)
                    }
                }
            }
            reader.readAsText(listingsFile)
        } else {
            setListings([])
            setShowListings(false)
        }
    }

    const handleUpload = async () => {
        if (files.length === 0) {
            setUploadStatus({
                type: "error",
                message: "Please select at least one file first",
            })
            return
        }

        if (!user) {
            setUploadStatus({
                type: "error",
                message: "Please log in to upload files",
            })
            return
        }

        setIsUploading(true)
        setUploadStatus({ type: null, message: "" })

        const idToken = await user.getIdToken()
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        // Separate listings file from regular course files
        const listingsFile = files.find((file) =>
            file.name.includes("Outline.uwaterloo.ca"),
        )
        const courseFiles = files.filter(
            (file) => !file.name.includes("Outline.uwaterloo.ca"),
        )

        // Process listings file first if present
        if (listingsFile) {
            const fileIndex = fileStatuses.findIndex(
                (fs) => fs.file === listingsFile,
            )
            if (fileIndex >= 0) {
                setFileStatuses((prev) => {
                    const updated = [...prev]
                    updated[fileIndex] = {
                        ...updated[fileIndex],
                        status: "uploading",
                    }
                    return updated
                })
            }

            try {
                const formData = new FormData()
                formData.append("file", listingsFile)

                const response = await fetch("/api/process-listings", {
                    method: "POST",
                    body: formData,
                    headers: { Authorization: `Bearer ${idToken}` },
                })

                const data = await response.json()

                if (data.success) {
                    successCount++
                    if (fileIndex >= 0) {
                        setFileStatuses((prev) => {
                            const updated = [...prev]
                            updated[fileIndex] = {
                                ...updated[fileIndex],
                                status: "success",
                                message: data.message || "Processed successfully",
                            }
                            return updated
                        })
                    }
                } else {
                    errorCount++
                    const errorMsg =
                        data.error || "Failed to process listings file"
                    errors.push(`${listingsFile.name}: ${errorMsg}`)
                    if (fileIndex >= 0) {
                        setFileStatuses((prev) => {
                            const updated = [...prev]
                            updated[fileIndex] = {
                                ...updated[fileIndex],
                                status: "error",
                                message: errorMsg,
                            }
                            return updated
                        })
                    }
                }
            } catch (error: any) {
                errorCount++
                const errorMsg = error.message || "Failed to upload file"
                errors.push(`${listingsFile.name}: ${errorMsg}`)
                if (fileIndex >= 0) {
                    setFileStatuses((prev) => {
                        const updated = [...prev]
                        updated[fileIndex] = {
                            ...updated[fileIndex],
                            status: "error",
                            message: errorMsg,
                        }
                        return updated
                    })
                }
            }
        }

        // Process regular course files
        for (const file of courseFiles) {
            const fileIndex = fileStatuses.findIndex((fs) => fs.file === file)
            if (fileIndex >= 0) {
                setFileStatuses((prev) => {
                    const updated = [...prev]
                    updated[fileIndex] = {
                        ...updated[fileIndex],
                        status: "uploading",
                    }
                    return updated
                })
            }

            try {
                const formData = new FormData()
                formData.append("file", file)

                const response = await fetch("/api/upload-outline", {
                    method: "POST",
                    body: formData,
                    headers: { Authorization: `Bearer ${idToken}` },
                })

                const data = await response.json()

                if (data.success) {
                    successCount++
                    if (fileIndex >= 0) {
                        setFileStatuses((prev) => {
                            const updated = [...prev]
                            updated[fileIndex] = {
                                ...updated[fileIndex],
                                status: "success",
                                message:
                                    data.message || "Uploaded successfully",
                                course: data.course
                                    ? {
                                        code: data.course.code,
                                        term: data.course.term,
                                    }
                                    : undefined,
                            }
                            return updated
                        })
                    }
                } else {
                    errorCount++
                    const errorMsg = data.error || "Failed to upload file"
                    errors.push(`${file.name}: ${errorMsg}`)
                    if (fileIndex >= 0) {
                        setFileStatuses((prev) => {
                            const updated = [...prev]
                            updated[fileIndex] = {
                                ...updated[fileIndex],
                                status: "error",
                                message: errorMsg,
                            }
                            return updated
                        })
                    }
                }
            } catch (error: any) {
                errorCount++
                const errorMsg = error.message || "Failed to upload file"
                errors.push(`${file.name}: ${errorMsg}`)
                if (fileIndex >= 0) {
                    setFileStatuses((prev) => {
                        const updated = [...prev]
                        updated[fileIndex] = {
                            ...updated[fileIndex],
                            status: "error",
                            message: errorMsg,
                        }
                        return updated
                    })
                }
            }
        }

        // Set overall status
        if (successCount > 0 && errorCount === 0) {
            setUploadStatus({
                type: "success",
                message: `Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""
                    }!`,
            })
            // Clear files and reload after a delay
            setTimeout(() => {
                setFiles([])
                setFileStatuses([])
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
                window.dispatchEvent(new CustomEvent("courseUploaded"))
                window.location.reload()
            }, 2000)
        } else if (successCount > 0 && errorCount > 0) {
            setUploadStatus({
                type: "error",
                message: `Uploaded ${successCount} file${successCount > 1 ? "s" : ""
                    } successfully, but ${errorCount} file${errorCount > 1 ? "s" : ""
                    } failed. See details below.`,
            })
        } else {
            setUploadStatus({
                type: "error",
                message: `Failed to upload ${errorCount} file${errorCount > 1 ? "s" : ""
                    }. See details below.`,
            })
        }

        setIsUploading(false)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Instructions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        How to Upload Course Outlines
                    </h2>
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        aria-label={
                            showInstructions
                                ? "Hide instructions"
                                : "Show instructions"
                        }
                    >
                        {showInstructions ? "Hide" : "Show"} Instructions
                    </button>
                </div>

                {showInstructions && (
                    <div className="space-y-4 text-gray-700">
                        <div className="space-y-4">
                            <div>
                                <p className="font-medium mb-2">
                                    For a single course:
                                </p>
                                <ol className="list-decimal list-inside space-y-2 text-sm">
                                    <li>
                                        Go to{" "}
                                        <a
                                            href="https://outline.uwaterloo.ca/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                                        >
                                            https://outline.uwaterloo.ca/
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </li>
                                    <li>
                                        Search for your course using the search
                                        bar
                                    </li>
                                    <li>
                                        Click on the course to view its details
                                    </li>
                                    <li>
                                        Click{" "}
                                        <strong>"Save a local copy"</strong> or
                                        use your browser's save feature (File →
                                        Save Page As)
                                    </li>
                                    <li>Save the file as an HTML file</li>
                                    <li>
                                        Upload the saved HTML file using the
                                        form below
                                    </li>
                                </ol>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Make sure you save the
                                page as an HTML file. The file should end with{" "}
                                <code className="bg-blue-100 px-1 rounded">
                                    .html
                                </code>
                            </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                            <p className="text-sm font-medium text-green-800 mb-2">
                                What will be extracted:
                            </p>
                            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                                <li>Course code, name, and term</li>
                                <li>Instructor information</li>
                                <li>Schedule (days, time, location)</li>
                                <li>
                                    Course description and learning outcomes
                                </li>
                                <li>Assessments and due dates</li>
                                <li>Required materials and readings</li>
                                <li>Course policies</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Upload Course Outline
                </h2>

                <div className="space-y-4">
                    {/* File Input */}
                    <div>
                        <label
                            htmlFor="file-upload"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Select HTML File(s) {files.length > 0 && `(${files.length} selected)`}
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                ref={fileInputRef}
                                id="file-upload"
                                type="file"
                                accept=".html"
                                multiple
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                        </div>
                        {files.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {files.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded"
                                    >
                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                        <span className="flex-1 truncate">
                                            {file.name}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            ({(file.size / 1024).toFixed(2)} KB)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || isUploading}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${files.length === 0 || isUploading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isListingsFile
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                    >
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Uploading {files.length} file{files.length > 1 ? "s" : ""}...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload {files.length > 0 ? `${files.length} ` : ""}Course
                                Outline{files.length > 1 ? "s" : ""}
                            </>
                        )}
                    </button>

                    {/* File Upload Status List */}
                    {fileStatuses.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">
                                Upload Progress:
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {fileStatuses.map((fileStatus, index) => (
                                    <div
                                        key={`${fileStatus.file.name}-${index}`}
                                        className={`p-3 rounded-lg border ${fileStatus.status === "success"
                                            ? "bg-green-50 border-green-200"
                                            : fileStatus.status === "error"
                                                ? "bg-red-50 border-red-200"
                                                : fileStatus.status ===
                                                    "uploading"
                                                    ? "bg-blue-50 border-blue-200"
                                                    : "bg-gray-50 border-gray-200"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {fileStatus.status === "success" ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : fileStatus.status === "error" ? (
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            ) : fileStatus.status ===
                                                "uploading" ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 flex-shrink-0 mt-0.5"></div>
                                            ) : (
                                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {fileStatus.file.name}
                                                </div>
                                                {fileStatus.status ===
                                                    "success" &&
                                                    fileStatus.course && (
                                                        <div className="text-xs text-green-700 mt-1">
                                                            {fileStatus.course.code}{" "}
                                                            - {fileStatus.course.term}
                                                        </div>
                                                    )}
                                                {fileStatus.message && (
                                                    <div
                                                        className={`text-xs mt-1 ${fileStatus.status ===
                                                            "success"
                                                            ? "text-green-700"
                                                            : fileStatus.status ===
                                                                "error"
                                                                ? "text-red-700"
                                                                : "text-blue-700"
                                                            }`}
                                                    >
                                                        {fileStatus.message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Listings Preview */}
                    {isListingsFile && showListings && listings.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-blue-900">
                                    Found {listings.length} courses in listings
                                    file
                                </h3>
                                <button
                                    onClick={() =>
                                        setShowListings(!showListings)
                                    }
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                    {showListings ? "Hide" : "Show"} List
                                </button>
                            </div>
                            {showListings && (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {listings.map((listing, idx) => (
                                        <div
                                            key={idx}
                                            className="text-xs text-blue-800 bg-blue-100 p-2 rounded"
                                        >
                                            <div className="font-medium">
                                                {listing.code}: {listing.title}
                                            </div>
                                            <div className="text-blue-600">
                                                {listing.term} - Sections:{" "}
                                                {listing.sections.join(", ")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-3 text-xs text-blue-700">
                                <p className="font-medium mb-1">This will:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>
                                        Use any saved HTML files from the{" "}
                                        <code className="bg-blue-100 px-1 rounded">
                                            course-outlines/
                                        </code>{" "}
                                        directory
                                    </li>
                                    <li>
                                        Parse each course outline to extract
                                        full details (assessments, materials,
                                        schedule, etc.)
                                    </li>
                                    <li>
                                        Add any new courses to your database
                                        with complete information
                                    </li>
                                    <li>
                                        Update existing courses if they already
                                        exist
                                    </li>
                                    <li>
                                        For courses without saved files, create
                                        basic entries from the listings
                                    </li>
                                </ul>
                                <p className="mt-2 text-blue-600 italic">
                                    <strong>Note:</strong> The system requires
                                    saved HTML files (downloaded manually)
                                    because outline.uwaterloo.ca uses Duo
                                    authentication. Files will be automatically
                                    matched by course code and term.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Status Message */}
                    {uploadStatus.type && (
                        <div
                            className={`p-4 rounded-lg flex items-start gap-3 ${uploadStatus.type === "success"
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                                }`}
                        >
                            {uploadStatus.type === "success" ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p
                                    className={`text-sm ${uploadStatus.type === "success"
                                        ? "text-green-800"
                                        : "text-red-800"
                                        }`}
                                >
                                    {uploadStatus.message}
                                </p>
                                {uploadStatus.type === "success" &&
                                    isListingsFile &&
                                    listings.length > 0 && (
                                        <div className="mt-2 text-xs text-green-700">
                                            <p>
                                                To download all course outlines:
                                            </p>
                                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                                <li>
                                                    Open each course URL in your
                                                    browser
                                                </li>
                                                <li>
                                                    Save each page as HTML in
                                                    the course-outlines/
                                                    directory
                                                </li>
                                                <li>
                                                    Upload this listings file
                                                    again to process all
                                                    downloaded outlines
                                                </li>
                                            </ol>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
