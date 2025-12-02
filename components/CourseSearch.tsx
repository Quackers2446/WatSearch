"use client"

import { useState, useEffect, useContext } from "react"
import { Search, Plus, BookOpen, User, Calendar, Loader2, Eye, X, MapPin, Clock, FileText, Target } from "lucide-react"
import { Course } from "@/types"
import { AuthContext } from "@/app/auth"
import { getAuth } from "firebase/auth"

interface CourseSearchProps {
    onCourseAdded?: () => void
}

export default function CourseSearch({ onCourseAdded }: CourseSearchProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isAdding, setIsAdding] = useState<string | null>(null)
    const [addedCourses, setAddedCourses] = useState<Set<string>>(new Set())
    const [error, setError] = useState<string | null>(null)
    const [previewCourse, setPreviewCourse] = useState<Course | null>(null)
    const user = useContext(AuthContext)

    // Load user's existing courses to check which ones are already added
    useEffect(() => {
        if (user) {
            loadUserCourses()
        }
    }, [user])

    const loadUserCourses = async () => {
        if (!user) return
        
        try {
            const idToken = await user.getIdToken()
            const response = await fetch("/api/courses", {
                headers: { Authorization: `Bearer ${idToken}` },
            })
            const data = await response.json()
            if (data.success && data.courses) {
                // Track which courses are already added (by code + term)
                const added = new Set<string>()
                data.courses.forEach((course: Course) => {
                    added.add(`${course.code}-${course.term}`)
                })
                setAddedCourses(added)
            }
        } catch (error) {
            console.error("Error loading user courses:", error)
        }
    }

    const searchCourses = async () => {
        if (!searchQuery.trim()) {
            setCourses([])
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `/api/courses/search?q=${encodeURIComponent(searchQuery)}&limit=50`
            )
            const data = await response.json()

            if (data.success) {
                setCourses(data.courses || [])
            } else {
                setError(data.error || "Failed to search courses")
            }
        } catch (err: any) {
            setError(err.message || "Failed to search courses")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddCourse = async (course: Course) => {
        if (!user) {
            setError("Please sign in to add courses")
            return
        }

        setIsAdding(course.id)
        setError(null)

        try {
            const idToken = await user.getIdToken()
            
            // Extract the outline ID from the course ID (format: outline-{id})
            const outlineId = course.id.replace("outline-", "")
            
            const response = await fetch("/api/courses/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    courseId: outlineId,
                    term: course.term,
                }),
            })

            const data = await response.json()

            if (data.success) {
                // Mark as added
                setAddedCourses((prev) => {
                    const next = new Set(prev)
                    next.add(`${course.code}-${course.term}`)
                    return next
                })
                
                if (onCourseAdded) {
                    onCourseAdded()
                }
            } else {
                setError(data.error || "Failed to add course")
            }
        } catch (err: any) {
            setError(err.message || "Failed to add course")
        } finally {
            setIsAdding(null)
        }
    }

    const isCourseAdded = (course: Course): boolean => {
        return addedCourses.has(`${course.code}-${course.term}`)
    }

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Search All Courses
                </h2>
                <p className="text-gray-600 mb-4">
                    Search through all available course outlines from the University of Waterloo
                </p>

                {/* Search Input */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by course code, name, instructor, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    searchCourses()
                                }
                            }}
                            className="input-field pl-10 w-full"
                        />
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                    </div>
                    <button
                        onClick={searchCourses}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search size={16} />
                                Search
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {courses.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Search Results ({courses.length})
                    </h3>
                    <div className="grid gap-4">
                        {courses.map((course) => {
                            const added = isCourseAdded(course)
                            const adding = isAdding === course.id

                            return (
                                <div
                                    key={course.id}
                                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <BookOpen className="text-blue-600" size={20} />
                                                <h4 className="text-xl font-bold text-gray-900">
                                                    {course.code}
                                                </h4>
                                                <span className="text-sm text-gray-500">
                                                    {course.term}
                                                </span>
                                            </div>
                                            <h5 className="text-lg font-semibold text-gray-800 mb-2">
                                                {course.name}
                                            </h5>
                                            {course.description && (
                                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                    {course.description}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                {course.instructor.name && (
                                                    <div className="flex items-center gap-1">
                                                        <User size={14} />
                                                        <span>{course.instructor.name}</span>
                                                    </div>
                                                )}
                                                {course.assessments.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        <span>
                                                            {course.assessments.length} assessment
                                                            {course.assessments.length !== 1
                                                                ? "s"
                                                                : ""}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex flex-col gap-2">
                                            <button
                                                onClick={() => setPreviewCourse(course)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                                            >
                                                <Eye size={16} />
                                                Preview
                                            </button>
                                            {added ? (
                                                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center">
                                                    Added
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddCourse(course)}
                                                    disabled={adding || !user}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                                >
                                                    {adding ? (
                                                        <>
                                                            <Loader2
                                                                className="animate-spin"
                                                                size={16}
                                                            />
                                                            Adding...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={16} />
                                                            Add Course
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {searchQuery && !isLoading && courses.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-500">No courses found matching your search.</p>
                </div>
            )}

            {!searchQuery && courses.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-500">
                        Enter a search query above to find courses.
                    </p>
                </div>
            )}

            {/* Preview Modal */}
            {previewCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {previewCourse.code}
                                </h3>
                                <p className="text-gray-600 mt-1">{previewCourse.name}</p>
                            </div>
                            <button
                                onClick={() => setPreviewCourse(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Close preview"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                        <Calendar size={16} />
                                        <span className="font-medium">Term</span>
                                    </div>
                                    <p className="text-gray-900">{previewCourse.term}</p>
                                </div>
                                {previewCourse.sections && previewCourse.sections.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                                            <BookOpen size={16} />
                                            <span className="font-medium">Sections</span>
                                        </div>
                                        <p className="text-gray-900">
                                            {previewCourse.sections.join(", ")}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Instructor */}
                            {previewCourse.instructor.name && (
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <User size={16} />
                                        <span className="font-medium">Instructor</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-900 font-medium">
                                            {previewCourse.instructor.name}
                                        </p>
                                        {previewCourse.instructor.email && (
                                            <p className="text-gray-600 text-sm mt-1">
                                                {previewCourse.instructor.email}
                                            </p>
                                        )}
                                        {previewCourse.instructor.office && (
                                            <p className="text-gray-600 text-sm mt-1">
                                                Office: {previewCourse.instructor.office}
                                            </p>
                                        )}
                                        {previewCourse.instructor.officeHours && (
                                            <p className="text-gray-600 text-sm mt-1">
                                                Office Hours: {previewCourse.instructor.officeHours}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {previewCourse.description && (
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <FileText size={16} />
                                        <span className="font-medium">Description</span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {previewCourse.description}
                                    </p>
                                </div>
                            )}

                            {/* Learning Outcomes */}
                            {previewCourse.learningOutcomes.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <Target size={16} />
                                        <span className="font-medium">Learning Outcomes</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                                        {previewCourse.learningOutcomes.map((outcome, index) => (
                                            <li key={index}>{outcome}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Assessments */}
                            {previewCourse.assessments.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <Calendar size={16} />
                                        <span className="font-medium">Assessments</span>
                                    </div>
                                    <div className="space-y-2">
                                        {previewCourse.assessments.map((assessment) => (
                                            <div
                                                key={assessment.id}
                                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">
                                                            {assessment.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Type: {assessment.type}
                                                        </p>
                                                        {assessment.description && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {assessment.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="font-semibold text-gray-900">
                                                            {assessment.weight}%
                                                        </p>
                                                        {assessment.dueDate && (() => {
                                                            let dueDate: Date
                                                            if (assessment.dueDate instanceof Date) {
                                                                dueDate = assessment.dueDate
                                                            } else {
                                                                dueDate = new Date(assessment.dueDate)
                                                            }
                                                            
                                                            if (!isNaN(dueDate.getTime())) {
                                                                return (
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        {dueDate.toLocaleDateString()}
                                                                    </p>
                                                                )
                                                            } else {
                                                                return (
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        {typeof assessment.dueDate === 'string' 
                                                                            ? assessment.dueDate 
                                                                            : 'TBA'}
                                                                    </p>
                                                                )
                                                            }
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Materials */}
                            {previewCourse.materials.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <BookOpen size={16} />
                                        <span className="font-medium">Required Materials</span>
                                    </div>
                                    <div className="space-y-2">
                                        {previewCourse.materials.map((material) => (
                                            <div
                                                key={material.id}
                                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">
                                                            {material.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Type: {material.type}
                                                        </p>
                                                        {material.notes && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {material.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                                material.required
                                                                    ? "bg-red-100 text-red-700"
                                                                    : "bg-gray-100 text-gray-700"
                                                            }`}
                                                        >
                                                            {material.required
                                                                ? "Required"
                                                                : "Optional"}
                                                        </span>
                                                        {material.price && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                ${material.price.toFixed(2)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Policies */}
                            {previewCourse.policies.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <FileText size={16} />
                                        <span className="font-medium">Policies</span>
                                    </div>
                                    <div className="space-y-2">
                                        {previewCourse.policies.map((policy, index) => (
                                            <div
                                                key={index}
                                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                            >
                                                <p className="text-gray-700 whitespace-pre-wrap text-sm">
                                                    {policy}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setPreviewCourse(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                            {!isCourseAdded(previewCourse) && (
                                <button
                                    onClick={() => {
                                        handleAddCourse(previewCourse)
                                        setPreviewCourse(null)
                                    }}
                                    disabled={isAdding === previewCourse.id || !user}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isAdding === previewCourse.id ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Add Course
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

