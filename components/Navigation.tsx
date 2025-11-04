'use client'

import { Search, Calendar, BookOpen, Clock, Upload } from 'lucide-react'

interface NavigationProps {
    activeTab: 'search' | 'dashboard' | 'courses' | 'upload'
    setActiveTab: (tab: 'search' | 'dashboard' | 'courses' | 'upload') => void
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
    const tabs = [
        { id: 'search', label: 'Search', icon: Search },
        { id: 'dashboard', label: 'Dashboard', icon: Calendar },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'upload', label: 'Upload', icon: Upload },
    ] as const

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <img
                                src="/logo.png"
                                alt="WatSearch Logo"
                                className="w-8 h-8 object-contain"
                            />
                            <h1 className="text-lg lg:text-xl font-bold text-gray-900">WatSearch</h1>
                        </div>

                        <div className="flex space-x-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${isActive
                                            ? 'bg-uw-red text-white'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon size={16} className="lg:hidden" />
                                        <Icon size={18} className="hidden lg:block" />
                                        <span className="font-medium text-sm lg:text-base hidden sm:block">{tab.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                            University of Waterloo
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
