"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Search,
    FileText,
    Download,
    Filter,
    SortAsc,
    SortDesc,
    Folder,
    X,
    Eye,
    ChevronDown,
    ChevronRight,
    BookOpen,
    Calendar,
    RefreshCw,
    Trash2,
    CheckSquare,
    Square,
} from "lucide-react"
import { Course } from "@/types"
import { AuthContext } from "@/app/auth"
import { useContext } from "react"
import {
    getCourseFiles,
    getFileBlobUrl,
    initDB,
    deleteFile as deleteIndexedFile,
} from "@/lib/indexeddb"

interface CourseFile {
    id: string
    courseId: string
    fileId: string
    relativePath: string
    filename: string
    category: string
    contentType: string
    uploadedAt: number
    extractedText?: string // Extracted text content for searchable files
}

interface FileMetadata {
    courseId: string
    relativePath: string
    filename: string
    category: string
    createdAt?: any
    updatedAt?: any
}

type SortField = "filename" | "category" | "uploadedAt" | "courseId"
type SortDirection = "asc" | "desc"
type ViewMode = "all" | "course"

const CATEGORY_LABELS: Record<string, string> = {
    assignment: "Assignment",
    assignment_solution: "Assignment Solution",
    quiz: "Quiz",
    quiz_overview: "Quiz Overview",
    synchronous_session_info: "Synchronous Session",
    lab_manual: "Lab Manual",
    lab_data: "Lab Data",
    lab_info: "Lab Info",
    lecture_notes: "Lecture Notes",
    module_page: "Module Page",
    tutorial: "Tutorial",
    tutorial_solution: "Tutorial Solution",
    exam_midterm: "Midterm Exam",
    exam_midterm_solution: "Midterm Solution",
    exam_final: "Final Exam",
    exam_final_solution: "Final Solution",
    syllabus: "Syllabus",
    course_admin: "Course Admin",
    code_asset: "Code Asset",
    media_asset: "Media Asset",
    reference: "Reference",
    misc: "Miscellaneous",
}

const CATEGORY_COLORS: Record<string, string> = {
    assignment: "bg-blue-100 text-blue-800",
    assignment_solution: "bg-green-100 text-green-800",
    quiz: "bg-purple-100 text-purple-800",
    quiz_overview: "bg-purple-100 text-purple-800",
    exam_midterm: "bg-red-100 text-red-800",
    exam_midterm_solution: "bg-green-100 text-green-800",
    exam_final: "bg-red-100 text-red-800",
    exam_final_solution: "bg-green-100 text-green-800",
    lab_manual: "bg-yellow-100 text-yellow-800",
    lab_data: "bg-orange-100 text-orange-800",
    tutorial: "bg-indigo-100 text-indigo-800",
    tutorial_solution: "bg-green-100 text-green-800",
    lecture_notes: "bg-gray-100 text-gray-800",
    module_page: "bg-cyan-100 text-cyan-800",
    syllabus: "bg-pink-100 text-pink-800",
    course_admin: "bg-gray-100 text-gray-800",
    reference: "bg-amber-100 text-amber-800",
    misc: "bg-gray-100 text-gray-800",
}

interface FileBrowserProps {
    courses: Course[]
}

export default function FileBrowser({ courses }: FileBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [sortField, setSortField] = useState<SortField>("filename")
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
    const [viewMode, setViewMode] = useState<ViewMode>("all")
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
    const [files, setFiles] = useState<CourseFile[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<CourseFile | null>(null)
    const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null)
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

    const user = useContext(AuthContext)

    // Load files from IndexedDB
    useEffect(() => {
        loadFiles()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, courses.length])

    const loadFiles = async () => {
        if (!user) return

        setIsLoading(true)
        try {
            await initDB()

            // Load files from IndexedDB for each course
            const allFiles: CourseFile[] = []

            for (const course of courses) {
                try {
                    const courseFiles = await getCourseFiles(course.id)
                    allFiles.push(...courseFiles)
                } catch (error) {
                    console.error(
                        `Error loading files for course ${course.id}:`,
                        error,
                    )
                }
            }

            setFiles(allFiles)
        } catch (error) {
            console.error("Error loading files:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Get unique categories from files
    const categories = useMemo(() => {
        const cats = new Set<string>()
        files.forEach((file) => cats.add(file.category))
        return Array.from(cats).sort()
    }, [files])

    // Filter and sort files
    const filteredFiles = useMemo(() => {
        let filtered = [...files]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (file) =>
                    file.filename.toLowerCase().includes(query) ||
                    file.relativePath.toLowerCase().includes(query) ||
                    (CATEGORY_LABELS[file.category] || file.category)
                        .toLowerCase()
                        .includes(query) ||
                    (file.extractedText && file.extractedText.toLowerCase().includes(query)),
            )
        }

        // Category filter
        if (selectedCategory) {
            filtered = filtered.filter(
                (file) => file.category === selectedCategory,
            )
        }

        // Course filter
        if (selectedCourseId) {
            filtered = filtered.filter(
                (file) => file.courseId === selectedCourseId,
            )
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal: any
            let bVal: any

            switch (sortField) {
                case "filename":
                    aVal = a.filename.toLowerCase()
                    bVal = b.filename.toLowerCase()
                    break
                case "category":
                    aVal = a.category
                    bVal = b.category
                    break
                case "uploadedAt":
                    aVal = a.uploadedAt
                    bVal = b.uploadedAt
                    break
                case "courseId":
                    aVal = a.courseId
                    bVal = b.courseId
                    break
                default:
                    return 0
            }

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
            return 0
        })

        return filtered
    }, [files, searchQuery, selectedCategory, selectedCourseId, sortField, sortDirection])

    // Group files by course
    const filesByCourse = useMemo(() => {
        const grouped = new Map<string, CourseFile[]>()
        filteredFiles.forEach((file) => {
            if (!grouped.has(file.courseId)) {
                grouped.set(file.courseId, [])
            }
            grouped.get(file.courseId)!.push(file)
        })
        return grouped
    }, [filteredFiles])

    const handleViewFile = async (file: CourseFile) => {
        try {
            const url = await getFileBlobUrl(file.courseId, file.fileId)
            if (url) {
                setSelectedFile(file)
                setFileBlobUrl(url)
            }
        } catch (error) {
            console.error("Error opening file:", error)
        }
    }

    const handleDownloadFile = async (file: CourseFile) => {
        try {
            const url = await getFileBlobUrl(file.courseId, file.fileId)
            if (url) {
                const a = document.createElement("a")
                a.href = url
                a.download = file.filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error("Error downloading file:", error)
        }
    }

    const handleDeleteFile = async (file: CourseFile) => {
        const confirmed = window.confirm(
            `Delete "${file.filename}" from ${getCourseName(file.courseId)}? This only affects your local browser storage.`,
        )
        if (!confirmed) return

        try {
            await deleteIndexedFile(file.courseId, file.fileId)
            setFiles((prev) =>
                prev.filter(
                    (f) =>
                        !(
                            f.courseId === file.courseId &&
                            f.fileId === file.fileId
                        ),
                ),
            )

            // Remove from selection if selected
            setSelectedFiles((prev) => {
                const newSet = new Set(prev)
                newSet.delete(file.id)
                return newSet
            })

            // Close viewer if this file was open
            if (
                selectedFile &&
                selectedFile.courseId === file.courseId &&
                selectedFile.fileId === file.fileId
            ) {
                if (fileBlobUrl) {
                    URL.revokeObjectURL(fileBlobUrl)
                }
                setSelectedFile(null)
                setFileBlobUrl(null)
            }
        } catch (error) {
            console.error("Error deleting file:", error)
            alert("Failed to delete file from local storage.")
        }
    }

    const handleBulkDelete = async () => {
        const filesToDelete = filteredFiles.filter((f) => selectedFiles.has(f.id))
        if (filesToDelete.length === 0) return

        const confirmed = window.confirm(
            `Delete ${filesToDelete.length} file${filesToDelete.length > 1 ? "s" : ""}? This only affects your local browser storage.`,
        )
        if (!confirmed) return

        try {
            // Delete all selected files
            for (const file of filesToDelete) {
                try {
                    await deleteIndexedFile(file.courseId, file.fileId)
                } catch (error) {
                    console.error(`Error deleting file ${file.filename}:`, error)
                }
            }

            // Remove deleted files from state
            setFiles((prev) =>
                prev.filter((f) => !selectedFiles.has(f.id)),
            )

            // Close viewer if the selected file was deleted
            if (selectedFile && selectedFiles.has(selectedFile.id)) {
                if (fileBlobUrl) {
                    URL.revokeObjectURL(fileBlobUrl)
                }
                setSelectedFile(null)
                setFileBlobUrl(null)
            }

            // Clear selection
            setSelectedFiles(new Set())
        } catch (error) {
            console.error("Error deleting files:", error)
            alert("Failed to delete some files from local storage.")
        }
    }

    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(fileId)) {
                newSet.delete(fileId)
            } else {
                newSet.add(fileId)
            }
            return newSet
        })
    }

    const toggleSelectAll = () => {
        if (selectedFiles.size === filteredFiles.length) {
            // Deselect all
            setSelectedFiles(new Set())
        } else {
            // Select all filtered files
            setSelectedFiles(new Set(filteredFiles.map((f) => f.id)))
        }
    }

    const toggleCourse = (courseId: string) => {
        const newExpanded = new Set(expandedCourses)
        if (newExpanded.has(courseId)) {
            newExpanded.delete(courseId)
        } else {
            newExpanded.add(courseId)
        }
        setExpandedCourses(newExpanded)
    }

    const getCourseName = (courseId: string) => {
        const course = courses.find((c) => c.id === courseId)
        return course ? `${course.code} - ${course.name}` : courseId
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Course Files
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Browse, search, and access all your course materials
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "all"
                                ? "bg-uw-red text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            All Files
                        </button>
                        <button
                            onClick={() => setViewMode("course")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "course"
                                ? "bg-uw-red text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            By Course
                        </button>
                        <button
                            onClick={loadFiles}
                            disabled={isLoading}
                            className="p-2 text-gray-600 hover:text-uw-red hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh files"
                        >
                            <RefreshCw
                                size={18}
                                className={isLoading ? "animate-spin" : ""}
                            />
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Search files by name, path, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uw-red focus:border-transparent"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        {/* Course Filter */}
                        <select
                            value={selectedCourseId || ""}
                            onChange={(e) =>
                                setSelectedCourseId(e.target.value || null)
                            }
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uw-red focus:border-transparent"
                        >
                            <option value="">All Courses</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.code} - {course.name}
                                </option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory || ""}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value || null)
                            }
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uw-red focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {CATEGORY_LABELS[cat] || cat}
                                </option>
                            ))}
                        </select>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <select
                                value={sortField}
                                onChange={(e) =>
                                    setSortField(e.target.value as SortField)
                                }
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-uw-red focus:border-transparent"
                            >
                                <option value="filename">Filename</option>
                                <option value="category">Category</option>
                                <option value="uploadedAt">Date</option>
                                <option value="courseId">Course</option>
                            </select>
                            <button
                                onClick={() =>
                                    setSortDirection(
                                        sortDirection === "asc" ? "desc" : "asc",
                                    )
                                }
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                {sortDirection === "asc" ? (
                                    <SortAsc size={20} />
                                ) : (
                                    <SortDesc size={20} />
                                )}
                            </button>
                        </div>

                        {/* Clear Filters */}
                        {(selectedCategory ||
                            selectedCourseId ||
                            searchQuery) && (
                                <button
                                    onClick={() => {
                                        setSelectedCategory(null)
                                        setSelectedCourseId(null)
                                        setSearchQuery("")
                                    }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                                >
                                    <X size={16} />
                                    Clear Filters
                                </button>
                            )}
                    </div>
                </div>

                {/* Stats and Bulk Actions */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredFiles.length} of {files.length} files
                        {selectedFiles.size > 0 && (
                            <span className="ml-2 text-uw-red font-medium">
                                ({selectedFiles.size} selected)
                            </span>
                        )}
                    </div>
                    {selectedFiles.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Trash2 size={16} />
                            Delete {selectedFiles.size} file{selectedFiles.size > 1 ? "s" : ""}
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uw-red mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading files...</p>
                </div>
            )}

            {/* File List */}
            {!isLoading && (
                <>
                    {viewMode === "all" ? (
                        /* All Files View */
                        <div className="space-y-2">
                            {filteredFiles.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                    <FileText
                                        className="mx-auto text-gray-400 mb-4"
                                        size={48}
                                    />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No files found
                                    </h3>
                                    <p className="text-gray-600">
                                        {files.length === 0
                                            ? "Upload course materials to get started"
                                            : "Try adjusting your search or filters"}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Select All Checkbox */}
                                    {filteredFiles.length > 0 && (
                                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                                            <button
                                                onClick={toggleSelectAll}
                                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                                            >
                                                {selectedFiles.size === filteredFiles.length ? (
                                                    <CheckSquare size={20} className="text-uw-red" />
                                                ) : (
                                                    <Square size={20} className="text-gray-400" />
                                                )}
                                                <span>
                                                    {selectedFiles.size === filteredFiles.length
                                                        ? "Deselect all"
                                                        : "Select all"}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                    {filteredFiles.map((file) => {
                                        const course = courses.find(
                                            (c) => c.id === file.courseId,
                                        )
                                        const isSelected = selectedFiles.has(file.id)
                                        return (
                                            <div
                                                key={file.id}
                                                className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${isSelected
                                                    ? "border-uw-red bg-red-50"
                                                    : "border-gray-200"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                                        <button
                                                            onClick={() => toggleFileSelection(file.id)}
                                                            className="mt-0.5 flex-shrink-0"
                                                        >
                                                            {isSelected ? (
                                                                <CheckSquare size={20} className="text-uw-red" />
                                                            ) : (
                                                                <Square size={20} className="text-gray-400" />
                                                            )}
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <FileText
                                                                    className="text-gray-400 flex-shrink-0"
                                                                    size={20}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                                                        {file.filename}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {file.relativePath}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                {course && (
                                                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                                                        <BookOpen size={12} />
                                                                        {course.code}
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={`text-xs px-2 py-1 rounded ${CATEGORY_COLORS[
                                                                        file.category
                                                                    ] ||
                                                                        "bg-gray-100 text-gray-800"
                                                                        }`}
                                                                >
                                                                    {
                                                                        CATEGORY_LABELS[
                                                                        file.category
                                                                        ] || file.category
                                                                    }
                                                                </span>
                                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {new Date(
                                                                        file.uploadedAt,
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <button
                                                            onClick={() =>
                                                                handleViewFile(file)
                                                            }
                                                            className="p-2 text-gray-600 hover:text-uw-red hover:bg-red-50 rounded-lg transition-colors"
                                                            title="View file"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDownloadFile(
                                                                    file,
                                                                )
                                                            }
                                                            className="p-2 text-gray-600 hover:text-uw-red hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Download file"
                                                        >
                                                            <Download size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteFile(
                                                                    file,
                                                                )
                                                            }
                                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete file from this browser"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            )}
                        </div>
                    ) : (
                        /* By Course View */
                        <div className="space-y-4">
                            {Array.from(filesByCourse.entries()).length ===
                                0 ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                    <Folder
                                        className="mx-auto text-gray-400 mb-4"
                                        size={48}
                                    />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No files found
                                    </h3>
                                    <p className="text-gray-600">
                                        {files.length === 0
                                            ? "Upload course materials to get started"
                                            : "Try adjusting your search or filters"}
                                    </p>
                                </div>
                            ) : (
                                Array.from(filesByCourse.entries()).map(
                                    ([courseId, courseFiles]) => {
                                        const course = courses.find(
                                            (c) => c.id === courseId,
                                        )
                                        const isExpanded =
                                            expandedCourses.has(courseId)

                                        return (
                                            <div
                                                key={courseId}
                                                className="bg-white rounded-lg shadow-sm border border-gray-200"
                                            >
                                                <button
                                                    onClick={() =>
                                                        toggleCourse(courseId)
                                                    }
                                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isExpanded ? (
                                                            <ChevronDown
                                                                size={20}
                                                                className="text-gray-400"
                                                            />
                                                        ) : (
                                                            <ChevronRight
                                                                size={20}
                                                                className="text-gray-400"
                                                            />
                                                        )}
                                                        <Folder
                                                            size={20}
                                                            className="text-gray-400"
                                                        />
                                                        <div className="text-left">
                                                            <h3 className="font-medium text-gray-900">
                                                                {course
                                                                    ? `${course.code} - ${course.name}`
                                                                    : courseId}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                {courseFiles.length}{" "}
                                                                file
                                                                {courseFiles.length !==
                                                                    1 && "s"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t border-gray-200 p-4 space-y-2">
                                                        {courseFiles.map(
                                                            (file) => {
                                                                const isSelected = selectedFiles.has(file.id)
                                                                return (
                                                                    <div
                                                                        key={
                                                                            file.id
                                                                        }
                                                                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isSelected
                                                                            ? "bg-red-50 border border-uw-red"
                                                                            : "bg-gray-50 hover:bg-gray-100"
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                            <button
                                                                                onClick={() => toggleFileSelection(file.id)}
                                                                                className="flex-shrink-0"
                                                                            >
                                                                                {isSelected ? (
                                                                                    <CheckSquare size={16} className="text-uw-red" />
                                                                                ) : (
                                                                                    <Square size={16} className="text-gray-400" />
                                                                                )}
                                                                            </button>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <FileText
                                                                                        size={
                                                                                            16
                                                                                        }
                                                                                        className="text-gray-400 flex-shrink-0"
                                                                                    />
                                                                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                                        {
                                                                                            file.filename
                                                                                        }
                                                                                    </h4>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <span
                                                                                        className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[
                                                                                            file.category
                                                                                        ] ||
                                                                                            "bg-gray-100 text-gray-800"
                                                                                            }`}
                                                                                    >
                                                                                        {
                                                                                            CATEGORY_LABELS[
                                                                                            file.category
                                                                                            ] ||
                                                                                            file.category
                                                                                        }
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500">
                                                                                        {new Date(
                                                                                            file.uploadedAt,
                                                                                        ).toLocaleDateString()}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 ml-4">
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleViewFile(
                                                                                        file,
                                                                                    )
                                                                                }
                                                                                className="p-1.5 text-gray-600 hover:text-uw-red hover:bg-red-50 rounded transition-colors"
                                                                                title="View file"
                                                                            >
                                                                                <Eye
                                                                                    size={
                                                                                        16
                                                                                    }
                                                                                />
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleDownloadFile(
                                                                                        file,
                                                                                    )
                                                                                }
                                                                                className="p-1.5 text-gray-600 hover:text-uw-red hover:bg-red-50 rounded transition-colors"
                                                                                title="Download file"
                                                                            >
                                                                                <Download
                                                                                    size={
                                                                                        16
                                                                                    }
                                                                                />
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleDeleteFile(
                                                                                        file,
                                                                                    )
                                                                                }
                                                                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                                title="Delete file from this browser"
                                                                            >
                                                                                <Trash2
                                                                                    size={
                                                                                        16
                                                                                    }
                                                                                />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    },
                                )
                            )}
                        </div>
                    )}
                </>
            )}

            {/* File Viewer Modal */}
            {selectedFile && fileBlobUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedFile.filename}
                            </h3>
                            <button
                                onClick={() => {
                                    setSelectedFile(null)
                                    if (fileBlobUrl) {
                                        URL.revokeObjectURL(fileBlobUrl)
                                    }
                                    setFileBlobUrl(null)
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {selectedFile.contentType.startsWith("image/") ? (
                                <img
                                    src={fileBlobUrl}
                                    alt={selectedFile.filename}
                                    className="max-w-full h-auto"
                                />
                            ) : selectedFile.contentType === "application/pdf" ? (
                                <iframe
                                    src={fileBlobUrl}
                                    className="w-full h-full min-h-[600px]"
                                    title={selectedFile.filename}
                                />
                            ) : selectedFile.contentType.startsWith(
                                "text/",
                            ) ? (
                                <iframe
                                    src={fileBlobUrl}
                                    className="w-full h-full min-h-[600px]"
                                    title={selectedFile.filename}
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <FileText
                                        className="mx-auto text-gray-400 mb-4"
                                        size={48}
                                    />
                                    <p className="text-gray-600 mb-4">
                                        Preview not available for this file type
                                    </p>
                                    <button
                                        onClick={() =>
                                            handleDownloadFile(selectedFile)
                                        }
                                        className="px-4 py-2 bg-uw-red text-white rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto"
                                    >
                                        <Download size={18} />
                                        Download File
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

