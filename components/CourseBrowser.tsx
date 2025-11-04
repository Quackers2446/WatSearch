"use client"

import { useState } from "react"
import {
    BookOpen,
    Calendar,
    User,
    MapPin,
    Clock,
    FileText,
    ChevronDown,
    ChevronRight,
} from "lucide-react"
import { Course } from "@/types"

interface CourseBrowserProps {
    courses: Course[]
}

export default function CourseBrowser({ courses }: CourseBrowserProps) {
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const filteredCourses = courses.filter(
        (course) =>
            course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
    )

    const toggleCourse = (courseId: string) => {
        setExpandedCourse(expandedCourse === courseId ? null : courseId)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Course Browser
                </h2>
                <p className="text-gray-600 mb-4">
                    Browse all your courses and access detailed information
                </p>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search courses by code, name, or instructor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-10"
                    />
                    <BookOpen
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                    />
                </div>
            </div>

            {/* Course List */}
            <div className="space-y-4">
                {filteredCourses.length === 0 ? (
                    <div className="card text-center py-12">
                        <BookOpen
                            className="mx-auto text-gray-400 mb-4"
                            size={48}
                        />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No courses found
                        </h3>
                        <p className="text-gray-600">
                            Try adjusting your search terms
                        </p>
                    </div>
                ) : (
                    filteredCourses.map((course) => (
                        <div key={course.id} className="card">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {course.code}
                                        </h3>
                                        <span className="px-2 py-1 bg-uw-red text-white text-xs rounded-full">
                                            {course.term}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mb-3">
                                        {course.name}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                        <div className="flex items-center space-x-2">
                                            <User size={16} />
                                            <span>
                                                {course.instructor.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Calendar size={16} />
                                            <span>
                                                {course.schedule.days.join(
                                                    ", ",
                                                )}{" "}
                                                {course.schedule.time}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <MapPin size={16} />
                                            <span>
                                                {course.schedule.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleCourse(course.id)}
                                    className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                                >
                                    {expandedCourse === course.id ? (
                                        <ChevronDown size={20} />
                                    ) : (
                                        <ChevronRight size={20} />
                                    )}
                                </button>
                            </div>

                            {/* Expanded Course Details */}
                            {expandedCourse === course.id && (
                                <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                                    {/* Course Description */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Course Description
                                        </h4>
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {course.description}
                                        </p>
                                    </div>

                                    {/* Learning Outcomes */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Learning Outcomes
                                        </h4>
                                        <ul className="space-y-1">
                                            {course.learningOutcomes.map(
                                                (outcome, index) => (
                                                    <li
                                                        key={index}
                                                        className="text-sm text-gray-700 flex items-start space-x-2"
                                                    >
                                                        <span className="text-uw-red mt-1">
                                                            •
                                                        </span>
                                                        <span>{outcome}</span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>

                                    {/* Assessments */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Assessments
                                        </h4>
                                        <div className="space-y-2">
                                            {course.assessments.map(
                                                (assessment) => (
                                                    <div
                                                        key={assessment.id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-2 h-2 bg-uw-red rounded-full"></div>
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {
                                                                    assessment.name
                                                                }
                                                            </span>
                                                            <span className="text-xs text-gray-500 capitalize">
                                                                {
                                                                    assessment.type
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {
                                                                    assessment.weight
                                                                }
                                                                %
                                                            </span>
                                                            {assessment.dueDate && (
                                                                <p className="text-xs text-gray-500">
                                                                    Due{" "}
                                                                    {typeof assessment.dueDate ===
                                                                    "string"
                                                                        ? new Date(
                                                                              assessment.dueDate,
                                                                          ).toLocaleDateString()
                                                                        : assessment.dueDate.toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {/* Materials */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Required Materials
                                        </h4>
                                        <div className="space-y-2">
                                            {course.materials.map(
                                                (material) => (
                                                    <div
                                                        key={material.id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <FileText
                                                                size={16}
                                                                className="text-gray-400"
                                                            />
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {
                                                                        material.title
                                                                    }
                                                                </span>
                                                                <p className="text-xs text-gray-500 capitalize">
                                                                    {material.type.replace(
                                                                        "_",
                                                                        " ",
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {material.required && (
                                                                <span className="text-xs bg-uw-red text-white px-2 py-1 rounded">
                                                                    Required
                                                                </span>
                                                            )}
                                                            {material.price && (
                                                                <p className="text-xs text-gray-500">
                                                                    $
                                                                    {
                                                                        material.price
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {/* Instructor Details */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Instructor Information
                                        </h4>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <User
                                                        size={16}
                                                        className="text-gray-400"
                                                    />
                                                    <span className="font-medium">
                                                        {course.instructor.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-500">
                                                        Email:
                                                    </span>
                                                    <a
                                                        href={`mailto:${course.instructor.email}`}
                                                        className="text-uw-red hover:text-red-700"
                                                    >
                                                        {
                                                            course.instructor
                                                                .email
                                                        }
                                                    </a>
                                                </div>
                                                {course.instructor.office && (
                                                    <div className="flex items-center space-x-2">
                                                        <MapPin
                                                            size={16}
                                                            className="text-gray-400"
                                                        />
                                                        <span>
                                                            Office:{" "}
                                                            {
                                                                course
                                                                    .instructor
                                                                    .office
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                {course.instructor
                                                    .officeHours && (
                                                    <div className="flex items-center space-x-2">
                                                        <Clock
                                                            size={16}
                                                            className="text-gray-400"
                                                        />
                                                        <span>
                                                            Office Hours:{" "}
                                                            {
                                                                course
                                                                    .instructor
                                                                    .officeHours
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Course Policies */}
                                    {course.policies.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                Important Policies
                                            </h4>
                                            <div className="space-y-2">
                                                {course.policies.map(
                                                    (policy, index) => (
                                                        <div
                                                            key={index}
                                                            className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                                                        >
                                                            <p className="text-sm text-gray-700">
                                                                {policy}
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
