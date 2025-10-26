'use client'

import { useState } from 'react'
import { Calendar, Clock, BookOpen, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react'
import { Course, Deadline } from '@/types'
import { format, isToday, isTomorrow, isThisWeek, addWeeks, isSameWeek } from 'date-fns'

interface DashboardProps {
    courses: Course[]
    deadlines: Deadline[]
}

export default function Dashboard({ courses, deadlines }: DashboardProps) {
    const [selectedDate, setSelectedDate] = useState(new Date())

    const todayDeadlines = deadlines.filter(d => isToday(d.dueDate))
    const tomorrowDeadlines = deadlines.filter(d => isTomorrow(d.dueDate))
    const thisWeekDeadlines = deadlines.filter(d => isThisWeek(d.dueDate) && !isToday(d.dueDate))
    const nextWeekDeadlines = deadlines.filter(d => isSameWeek(d.dueDate, addWeeks(new Date(), 1), { weekStartsOn: 1 }))

    const getDeadlinePriority = (deadline: Deadline) => {
        if (isToday(deadline.dueDate)) return 'urgent'
        if (isTomorrow(deadline.dueDate)) return 'high'
        if (isThisWeek(deadline.dueDate)) return 'medium'
        return 'low'
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return AlertTriangle
            case 'high': return Clock
            case 'medium': return Calendar
            default: return CheckCircle
        }
    }

    return (
        <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Academic Dashboard</h2>
                <p className="text-gray-600">Your personalized view of courses, deadlines, and academic progress</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Courses</p>
                            <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Due Today</p>
                            <p className="text-2xl font-bold text-gray-900">{todayDeadlines.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Due Tomorrow</p>
                            <p className="text-2xl font-bold text-gray-900">{tomorrowDeadlines.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Calendar className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">This Week</p>
                            <p className="text-2xl font-bold text-gray-900">{thisWeekDeadlines.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Deadlines */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
                        <span className="text-sm text-gray-500">{deadlines.length} total</span>
                    </div>

                    <div className="space-y-3">
                        {deadlines.slice(0, 8).map((deadline) => {
                            const priority = getDeadlinePriority(deadline)
                            const PriorityIcon = getPriorityIcon(priority)

                            return (
                                <div
                                    key={deadline.id}
                                    className={`p-3 rounded-lg border ${getPriorityColor(priority)}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <PriorityIcon size={16} />
                                                <span className="font-medium text-sm">{deadline.title}</span>
                                            </div>
                                            <p className="text-xs text-gray-600">{deadline.courseCode} - {deadline.courseName}</p>
                                            {deadline.description && (
                                                <p className="text-xs text-gray-500 mt-1">{deadline.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {format(deadline.dueDate, 'MMM d')}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {deadline.daysUntilDue === 0 ? 'Today' :
                                                    deadline.daysUntilDue === 1 ? 'Tomorrow' :
                                                        `${deadline.daysUntilDue} days`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {deadlines.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="mx-auto mb-2" size={32} />
                                <p>No upcoming deadlines</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Course Overview */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Course Overview</h3>
                        <span className="text-sm text-gray-500">{courses.length} courses</span>
                    </div>

                    <div className="space-y-4">
                        {courses.map((course) => {
                            const courseDeadlines = deadlines.filter(d => d.courseCode === course.code)
                            const upcomingCount = courseDeadlines.filter(d => d.isUpcoming).length

                            return (
                                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{course.code}</h4>
                                            <p className="text-sm text-gray-600">{course.name}</p>
                                        </div>
                                        <span className="text-xs text-gray-500">{course.term}</span>
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div className="flex items-center space-x-2">
                                            <span>Instructor:</span>
                                            <span>{course.instructor.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span>Schedule:</span>
                                            <span>{course.schedule.days.join(', ')} {course.schedule.time}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span>Location:</span>
                                            <span>{course.schedule.location}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                                {upcomingCount} upcoming deadlines
                                            </span>
                                            <button className="text-uw-red hover:text-red-700 flex items-center space-x-1">
                                                <span>View Details</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {deadlines.slice(0, 5).map((deadline) => (
                        <div key={deadline.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-uw-red rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{deadline.title}</p>
                                <p className="text-xs text-gray-600">{deadline.courseCode} - Due {format(deadline.dueDate, 'MMM d, yyyy')}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                                {deadline.daysUntilDue === 0 ? 'Today' :
                                    deadline.daysUntilDue === 1 ? 'Tomorrow' :
                                        `${deadline.daysUntilDue} days`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
