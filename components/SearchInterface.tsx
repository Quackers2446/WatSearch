"use client"

import { useState, useMemo } from "react"
import {
    Search,
    Filter,
    Calendar,
    BookOpen,
    Clock,
    ChevronDown,
} from "lucide-react"
import { Course, Deadline, SearchFilters } from "@/types"
import Fuse from "fuse.js"

interface SearchInterfaceProps {
    courses: Course[]
    deadlines: Deadline[]
    filters: SearchFilters
    onFiltersChange: (filters: SearchFilters) => void
}

export default function SearchInterface({
    courses,
    deadlines,
    filters,
    onFiltersChange,
}: SearchInterfaceProps) {
    const [query, setQuery] = useState("")
    const [showFilters, setShowFilters] = useState(false)

    // Configure Fuse.js for fuzzy search
    const fuseOptions = {
        keys: [
            "code",
            "name",
            "description",
            "instructor.name",
            "assessments.name",
            "materials.title",
        ],
        threshold: 0.3,
        includeScore: true,
    }

    const fuse = new Fuse(courses, fuseOptions)

    const searchResults = useMemo(() => {
        if (!query.trim()) {
            return courses
        }

        const results = fuse.search(query)
        return results.map((result) => result.item)
    }, [query, courses])

    const filteredResults = useMemo(() => {
        let filtered = searchResults

        if (filters.courseCode) {
            filtered = filtered.filter((course) =>
                course.code
                    .toLowerCase()
                    .includes(filters.courseCode!.toLowerCase()),
            )
        }

        if (filters.type) {
            filtered = filtered.filter((course) =>
                course.assessments.some(
                    (assessment) => assessment.type === filters.type,
                ),
            )
        }

        if (filters.upcoming) {
            filtered = filtered.filter((course) =>
                course.assessments.some(
                    (assessment) =>
                        assessment.dueDate &&
                        new Date(assessment.dueDate) > new Date() &&
                        new Date(assessment.dueDate) <=
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                ),
            )
        }

        return filtered
    }, [searchResults, filters])

    const upcomingDeadlines = deadlines.filter((d) => d.isUpcoming).slice(0, 5)

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Search Academic Resources
                </h2>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-1 relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Search courses, assignments, materials..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
                    >
                        <Filter size={18} />
                        <span>Filters</span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Course Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., CS 343"
                                    value={filters.courseCode || ""}
                                    onChange={(e) =>
                                        onFiltersChange({
                                            ...filters,
                                            courseCode: e.target.value,
                                        })
                                    }
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    value={filters.type || ""}
                                    onChange={(e) =>
                                        onFiltersChange({
                                            ...filters,
                                            type: e.target.value || undefined,
                                        })
                                    }
                                    className="input-field"
                                >
                                    <option value="">All Types</option>
                                    <option value="assignment">
                                        Assignment
                                    </option>
                                    <option value="exam">Exam</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="lab">Lab</option>
                                    <option value="project">Project</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="upcoming"
                                    checked={filters.upcoming || false}
                                    onChange={(e) =>
                                        onFiltersChange({
                                            ...filters,
                                            upcoming: e.target.checked,
                                        })
                                    }
                                    className="rounded"
                                />
                                <label
                                    htmlFor="upcoming"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Upcoming deadlines only
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">
                                Total Courses
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {courses.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Clock className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">
                                Upcoming Deadlines
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {upcomingDeadlines.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Calendar className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">
                                Search Results
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredResults.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Search className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">
                                Active Filters
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Object.values(filters).filter(Boolean).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Results */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Search Results ({filteredResults.length})
                </h3>

                {filteredResults.length === 0 ? (
                    <div className="card text-center py-12">
                        <Search
                            className="mx-auto text-gray-400 mb-4"
                            size={48}
                        />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No results found
                        </h3>
                        <p className="text-gray-600">
                            Try adjusting your search terms or filters
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredResults.map((course) => (
                            <div key={course.id} className="card">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            {course.code}
                                        </h4>
                                        <p className="text-gray-600">
                                            {course.name}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-uw-red text-white text-xs rounded-full">
                                        {course.term}
                                    </span>
                                </div>

                                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                                    {course.description}
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <span className="font-medium">
                                            Instructor:
                                        </span>
                                        <span className="ml-2">
                                            {course.instructor.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-600">
                                        <span className="font-medium">
                                            Schedule:
                                        </span>
                                        <span className="ml-2">
                                            {course.schedule.days.join(", ")}{" "}
                                            {course.schedule.time}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-600">
                                        <span className="font-medium">
                                            Location:
                                        </span>
                                        <span className="ml-2">
                                            {course.schedule.location}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                            {course.assessments.length}{" "}
                                            assessments
                                        </span>
                                        <span className="text-gray-600">
                                            {course.materials.length} materials
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
