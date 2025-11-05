"use client"

import { useState, useEffect } from "react"
import { Search, Calendar, BookOpen, Clock, Filter } from "lucide-react"
import { Course, Deadline, SearchFilters } from "@/types"
import SearchInterface from "@/components/SearchInterface"
import Dashboard from "@/components/Dashboard"
import CourseBrowser from "@/components/CourseBrowser"
import UploadOutline from "@/components/UploadOutline"
import Navigation from "@/components/Navigation"
import About from "@/components/About"

export default function Home() {
    const [courses, setCourses] = useState<Course[]>([])
    const [deadlines, setDeadlines] = useState<Deadline[]>([])
    const [activeTab, setActiveTab] = useState<
        "search" | "dashboard" | "courses" | "upload" | "about"
    >("search")
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({})
    const [isLoading, setIsLoading] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    useEffect(() => {
        // Load course data
        loadCourseData()

        // Set up polling to check for new data every 5 seconds
        const interval = setInterval(() => {
            loadCourseData()
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    const loadCourseData = async () => {
        try {
            setIsLoading(true)
            // Load course data from API endpoint (which reads from JSON file)
            const response = await fetch("/api/courses")
            const data = await response.json()
            const parsedCourses: Course[] = data.courses || []

            setCourses(parsedCourses)
            setLastUpdated(new Date())

            // Generate deadlines from assessments
            const allDeadlines: Deadline[] = []
            parsedCourses.forEach((course) => {
                course.assessments.forEach((assessment) => {
                    if (assessment.dueDate) {
                        const now = new Date()
                        // Handle date strings from JSON
                        const dueDate =
                            typeof assessment.dueDate === "string"
                                ? new Date(assessment.dueDate)
                                : assessment.dueDate
                        const daysUntilDue = Math.ceil(
                            (dueDate.getTime() - now.getTime()) /
                                (1000 * 60 * 60 * 24),
                        )

                        allDeadlines.push({
                            id: `${course.id}-${assessment.id}`,
                            title: assessment.name,
                            courseCode: course.code,
                            courseName: course.name,
                            dueDate: dueDate,
                            type: assessment.type,
                            weight: assessment.weight,
                            description: assessment.description,
                            isUpcoming: daysUntilDue <= 30 && daysUntilDue >= 0,
                            daysUntilDue,
                        })
                    }
                })
            })

            setDeadlines(
                allDeadlines.sort(
                    (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
                ),
            )
        } catch (error) {
            console.error("Error loading course data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const upcomingDeadlines = deadlines.filter((d) => d.isUpcoming)

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Status Bar */}
            {isLoading && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                    <div className="container mx-auto flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-700">
                            Updating course data...
                        </span>
                    </div>
                </div>
            )}

            {lastUpdated && !isLoading && (
                <div className="bg-green-50 border-b border-green-200 px-4 py-2">
                    <div className="container mx-auto flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-4 py-8">
                {activeTab === "search" && (
                    <SearchInterface
                        courses={courses}
                        deadlines={deadlines}
                        filters={searchFilters}
                        onFiltersChange={setSearchFilters}
                    />
                )}

                {activeTab === "dashboard" && (
                    <Dashboard
                        courses={courses}
                        deadlines={upcomingDeadlines}
                    />
                )}

                {activeTab === "courses" && <CourseBrowser courses={courses} />}

                {activeTab === "upload" && <UploadOutline />}

                {activeTab === "about" && <About />}
            </main>
        </div>
    )
}
