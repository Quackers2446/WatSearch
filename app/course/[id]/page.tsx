import { notFound } from 'next/navigation'
import { BookOpen, Calendar, User, MapPin, Clock, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Course } from '@/types'

interface CoursePageProps {
    params: {
        id: string
    }
}

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
    }
]

export default function CoursePage({ params }: CoursePageProps) {
    const course = mockCourses.find(c => c.id === params.id)

    if (!course) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/courses"
                        className="inline-flex items-center text-uw-red hover:text-red-700 mb-4"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Courses
                    </Link>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.code}</h1>
                                <h2 className="text-xl text-gray-700 mb-4">{course.name}</h2>
                                <span className="inline-block px-3 py-1 bg-uw-red text-white text-sm rounded-full">
                                    {course.term}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                                <User size={16} className="text-gray-400" />
                                <span className="font-medium">{course.instructor.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar size={16} className="text-gray-400" />
                                <span>{course.schedule.days.join(', ')} {course.schedule.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <MapPin size={16} className="text-gray-400" />
                                <span>{course.schedule.location}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Course Description */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Description</h3>
                            <p className="text-gray-700 leading-relaxed">{course.description}</p>
                        </div>

                        {/* Learning Outcomes */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Outcomes</h3>
                            <ul className="space-y-2">
                                {course.learningOutcomes.map((outcome, index) => (
                                    <li key={index} className="flex items-start space-x-3">
                                        <span className="text-uw-red mt-1">•</span>
                                        <span className="text-gray-700">{outcome}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Assessments */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessments</h3>
                            <div className="space-y-3">
                                {course.assessments.map((assessment) => (
                                    <div key={assessment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-3 h-3 bg-uw-red rounded-full"></div>
                                            <div>
                                                <span className="font-medium text-gray-900">{assessment.name}</span>
                                                <p className="text-sm text-gray-500 capitalize">{assessment.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-medium text-gray-900">{assessment.weight}%</span>
                                            {assessment.dueDate && (
                                                <p className="text-sm text-gray-500">
                                                    Due {assessment.dueDate.toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Materials */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Materials</h3>
                            <div className="space-y-3">
                                {course.materials.map((material) => (
                                    <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <FileText size={20} className="text-gray-400" />
                                            <div>
                                                <span className="font-medium text-gray-900">{material.title}</span>
                                                <p className="text-sm text-gray-500 capitalize">{material.type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {material.required && (
                                                <span className="text-xs bg-uw-red text-white px-2 py-1 rounded mr-2">Required</span>
                                            )}
                                            {material.price && (
                                                <span className="text-sm font-medium text-gray-900">${material.price}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Instructor Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <User size={16} className="text-gray-400" />
                                    <span className="font-medium">{course.instructor.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-500">Email:</span>
                                    <a href={`mailto:${course.instructor.email}`} className="text-uw-red hover:text-red-700">
                                        {course.instructor.email}
                                    </a>
                                </div>
                                {course.instructor.office && (
                                    <div className="flex items-center space-x-2">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span>Office: {course.instructor.office}</span>
                                    </div>
                                )}
                                {course.instructor.officeHours && (
                                    <div className="flex items-center space-x-2">
                                        <Clock size={16} className="text-gray-400" />
                                        <span>Office Hours: {course.instructor.officeHours}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Course Policies */}
                        {course.policies.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Policies</h3>
                                <div className="space-y-3">
                                    {course.policies.map((policy, index) => (
                                        <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-gray-700">{policy}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                                    View on LEARN
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                                    Join Piazza Discussion
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                                    View Course Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
