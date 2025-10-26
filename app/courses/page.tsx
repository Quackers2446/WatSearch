import Link from 'next/link'
import { BookOpen, Calendar, User, MapPin, ArrowRight } from 'lucide-react'
import { Course } from '@/types'

// Mock data - in a real app, this would come from your data source
const mockCourses: Course[] = [
    {
        id: 'cs350',
        code: 'CS 350',
        name: 'Operating Systems',
        term: 'Fall 2025',
        instructor: {
            name: 'Dr. John Smith',
            email: 'john.smith@uwaterloo.ca',
            office: 'DC 1234',
            officeHours: 'Tuesdays 2-4 PM'
        },
        schedule: {
            days: ['Monday', 'Wednesday', 'Friday'],
            time: '10:30 AM - 11:20 AM',
            location: 'MC 2065'
        },
        description: 'An introduction to operating systems concepts including processes, threads, memory management, file systems, and concurrency.',
        learningOutcomes: [
            'Understand fundamental operating system concepts',
            'Implement basic system programming techniques',
            'Analyze performance implications of system design choices',
            'Apply concurrency principles to solve real-world problems'
        ],
        assessments: [
            {
                id: 'a1',
                name: 'Assignment 1: Process Management',
                type: 'assignment',
                weight: 15,
                dueDate: new Date('2025-10-15')
            },
            {
                id: 'a2',
                name: 'Assignment 2: Memory Management',
                type: 'assignment',
                weight: 15,
                dueDate: new Date('2025-11-05')
            },
            {
                id: 'midterm',
                name: 'Midterm Exam',
                type: 'exam',
                weight: 25,
                dueDate: new Date('2025-10-30')
            },
            {
                id: 'final',
                name: 'Final Exam',
                type: 'exam',
                weight: 45,
                dueDate: new Date('2025-12-15')
            }
        ],
        materials: [
            {
                id: 'textbook',
                title: 'Operating System Concepts',
                type: 'textbook',
                required: true,
                price: 120
            },
            {
                id: 'lab_manual',
                title: 'CS 350 Lab Manual',
                type: 'lab_manual',
                required: true,
                price: 25
            }
        ],
        policies: [
            'Late assignments will be penalized 10% per day',
            'Academic integrity is strictly enforced',
            'No collaboration on individual assignments'
        ]
    },
    {
        id: 'cs341',
        code: 'CS 341',
        name: 'Algorithms',
        term: 'Fall 2025',
        instructor: {
            name: 'Dr. Jane Doe',
            email: 'jane.doe@uwaterloo.ca',
            office: 'DC 2345',
            officeHours: 'Mondays 3-5 PM'
        },
        schedule: {
            days: ['Tuesday', 'Thursday'],
            time: '2:30 PM - 3:50 PM',
            location: 'MC 2066'
        },
        description: 'Design and analysis of algorithms with emphasis on fundamental techniques and complexity analysis.',
        learningOutcomes: [
            'Analyze time and space complexity of algorithms',
            'Design efficient algorithms for common problems',
            'Apply algorithmic techniques to solve complex problems',
            'Understand advanced data structures and their applications'
        ],
        assessments: [
            {
                id: 'a1',
                name: 'Assignment 1: Sorting Algorithms',
                type: 'assignment',
                weight: 20,
                dueDate: new Date('2025-10-10')
            },
            {
                id: 'midterm',
                name: 'Midterm Exam',
                type: 'exam',
                weight: 30,
                dueDate: new Date('2025-11-15')
            },
            {
                id: 'final',
                name: 'Final Exam',
                type: 'exam',
                weight: 50,
                dueDate: new Date('2025-12-20')
            }
        ],
        materials: [
            {
                id: 'textbook',
                title: 'Introduction to Algorithms',
                type: 'textbook',
                required: true,
                price: 150
            }
        ],
        policies: [
            'Collaboration on assignments is not permitted',
            'Late submissions will not be accepted',
            'Academic integrity violations will result in course failure'
        ]
    }
]

export default function CoursesPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
                    <p className="text-gray-600">Fall 2025 Term</p>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockCourses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/course/${course.id}`}
                            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="p-6">
                                {/* Course Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-uw-red transition-colors">
                                            {course.code}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">{course.name}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-uw-red text-white text-xs rounded-full">
                                        {course.term}
                                    </span>
                                </div>

                                {/* Course Info */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <User size={14} className="mr-2 text-gray-400" />
                                        <span>{course.instructor.name}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar size={14} className="mr-2 text-gray-400" />
                                        <span>{course.schedule.days.join(', ')} {course.schedule.time}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MapPin size={14} className="mr-2 text-gray-400" />
                                        <span>{course.schedule.location}</span>
                                    </div>
                                </div>

                                {/* Course Description */}
                                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                                    {course.description}
                                </p>

                                {/* Course Stats */}
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <span>{course.assessments.length} assessments</span>
                                    <span>{course.materials.length} materials</span>
                                </div>

                                {/* View Details Link */}
                                <div className="flex items-center text-uw-red group-hover:text-red-700 text-sm font-medium">
                                    <span>View Details</span>
                                    <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Empty State */}
                {mockCourses.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                        <p className="text-gray-600 mb-4">You don't have any courses for this term.</p>
                        <button className="btn-primary">
                            Add Course
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
