'use client'

import { useState, useEffect } from 'react'
import { Search, Calendar, BookOpen, Clock, Filter } from 'lucide-react'
import { Course, Deadline, SearchFilters } from '@/types'
import SearchInterface from '@/components/SearchInterface'
import Dashboard from '@/components/Dashboard'
import CourseBrowser from '@/components/CourseBrowser'
import Navigation from '@/components/Navigation'

export default function Home() {
    const [courses, setCourses] = useState<Course[]>([])
    const [deadlines, setDeadlines] = useState<Deadline[]>([])
    const [activeTab, setActiveTab] = useState<'search' | 'dashboard' | 'courses'>('search')
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({})

    useEffect(() => {
        // Load course data
        loadCourseData()
    }, [])

    const loadCourseData = async () => {
        try {
            // Load parsed course data from JSON file
            const courseData = await import('../data/courses.json')
            const parsedCourses: Course[] = courseData.default || courseData

            setCourses(parsedCourses)

            // Generate deadlines from assessments
            const allDeadlines: Deadline[] = []
            parsedCourses.forEach(course => {
                course.assessments.forEach(assessment => {
                    if (assessment.dueDate) {
                        const now = new Date()
                        const dueDate = assessment.dueDate
                        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                        allDeadlines.push({
                            id: `${course.id}-${assessment.id}`,
                            title: assessment.name,
                            courseCode: course.code,
                            courseName: course.name,
                            dueDate: assessment.dueDate,
                            type: assessment.type,
                            weight: assessment.weight,
                            description: assessment.description,
                            isUpcoming: daysUntilDue <= 30 && daysUntilDue >= 0,
                            daysUntilDue
                        })
                    }
                })
            })

            setDeadlines(allDeadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()))
        } catch (error) {
            console.error('Error loading course data:', error)
        }
    }

    const upcomingDeadlines = deadlines.filter(d => d.isUpcoming)

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="container mx-auto px-4 py-8">
                {activeTab === 'search' && (
                    <SearchInterface
                        courses={courses}
                        deadlines={deadlines}
                        filters={searchFilters}
                        onFiltersChange={setSearchFilters}
                    />
                )}

                {activeTab === 'dashboard' && (
                    <Dashboard
                        courses={courses}
                        deadlines={upcomingDeadlines}
                    />
                )}

                {activeTab === 'courses' && (
                    <CourseBrowser courses={courses} />
                )}
            </main>
        </div>
    )
}
