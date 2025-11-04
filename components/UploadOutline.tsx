'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Info, ExternalLink, Download, RefreshCw } from 'lucide-react'

interface CourseListing {
    code: string
    title: string
    term: string
    sections: string[]
    viewUrl: string
    outlineId: string
}

export default function UploadOutline() {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<{
        type: 'success' | 'error' | null
        message: string
    }>({ type: null, message: '' })
    const [showInstructions, setShowInstructions] = useState(true)
    const [isListingsFile, setIsListingsFile] = useState(false)
    const [listings, setListings] = useState<CourseListing[]>([])
    const [showListings, setShowListings] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (selectedFile.name.endsWith('.html')) {
                setFile(selectedFile)
                setUploadStatus({ type: null, message: '' })

                // Check if this is a listings file based on filename
                const isListings = selectedFile.name.includes('Outline.uwaterloo.ca')
                setIsListingsFile(isListings)

                if (isListings) {
                    // Preview the listings file by reading it
                    const reader = new FileReader()
                    reader.onload = async (event) => {
                        const html = event.target?.result as string

                        // Quick check if it contains listings indicators
                        if (html.includes('Browse Outlines') || html.includes('My Enrolled Courses')) {
                            // Preview the listings file
                            const formData = new FormData()
                            formData.append('file', selectedFile)
                            formData.append('action', 'parse_only')

                            try {
                                const response = await fetch('/api/process-listings', {
                                    method: 'POST',
                                    body: formData
                                })

                                const data = await response.json()
                                if (data.success && data.listings) {
                                    setListings(data.listings)
                                    setShowListings(true)
                                }
                            } catch (error) {
                                console.error('Error previewing listings:', error)
                            }
                        }
                    }
                    reader.readAsText(selectedFile)
                } else {
                    setListings([])
                    setShowListings(false)
                }
            } else {
                setUploadStatus({
                    type: 'error',
                    message: 'Please select an HTML file'
                })
                setFile(null)
                setIsListingsFile(false)
                setListings([])
            }
        }
    }

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus({
                type: 'error',
                message: 'Please select a file first'
            })
            return
        }

        setIsUploading(true)
        setUploadStatus({ type: null, message: '' })

        try {
            const formData = new FormData()
            formData.append('file', file)

            const endpoint = isListingsFile ? '/api/process-listings' : '/api/upload-outline'
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                const message = isListingsFile
                    ? data.message || `Successfully processed ${data.listings?.length || 0} course listings. Fetched ${data.successCount || 0} courses with full details.`
                    : data.message || 'Course outline uploaded successfully!'

                setUploadStatus({
                    type: 'success',
                    message
                })
                setFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
                // Trigger a custom event to refresh course data
                window.dispatchEvent(new CustomEvent('courseUploaded'))
                // Reload the page after a short delay to show the new courses
                setTimeout(() => {
                    window.location.reload()
                }, isListingsFile ? 3000 : 2000)
            } else {
                setUploadStatus({
                    type: 'error',
                    message: data.error || 'Failed to upload course outline'
                })
            }
        } catch (error) {
            setUploadStatus({
                type: 'error',
                message: 'An error occurred while uploading. Please try again.'
            })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Instructions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        How to Upload Course Outlines
                    </h2>
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        aria-label={showInstructions ? 'Hide instructions' : 'Show instructions'}
                    >
                        {showInstructions ? 'Hide' : 'Show'} Instructions
                    </button>
                </div>

                {showInstructions && (
                    <div className="space-y-4 text-gray-700">
                        <div className="space-y-4">
                            <div>
                                <p className="font-medium mb-2">For a single course:</p>
                                <ol className="list-decimal list-inside space-y-2 text-sm">
                                    <li>
                                        Go to{' '}
                                        <a
                                            href="https://outline.uwaterloo.ca/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                                        >
                                            https://outline.uwaterloo.ca/
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </li>
                                    <li>Search for your course using the search bar</li>
                                    <li>Click on the course to view its details</li>
                                    <li>
                                        Click <strong>"Save a local copy"</strong> or use your browser's save feature (File → Save Page As)
                                    </li>
                                    <li>Save the file as an HTML file</li>
                                    <li>Upload the saved HTML file using the form below</li>
                                </ol>
                            </div>
                            <div className="border-t pt-3">
                                <p className="font-medium mb-2">For multiple courses (batch upload):</p>
                                <ol className="list-decimal list-inside space-y-2 text-sm">
                                    <li>
                                        Go to{' '}
                                        <a
                                            href="https://outline.uwaterloo.ca/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                                        >
                                            https://outline.uwaterloo.ca/
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                        {' '}and view your enrolled courses (you'll need to authenticate with Duo)
                                    </li>
                                    <li>Save the page as <code className="bg-blue-100 px-1 rounded">Outline.uwaterloo.ca.html</code> in the <code className="bg-blue-100 px-1 rounded">course-outlines/</code> directory</li>
                                    <li>Upload the listings file - it will show all your courses and create basic entries</li>
                                    <li>
                                        <strong>Download each course outline:</strong> Click each "View" link, then save each page as HTML in the <code className="bg-blue-100 px-1 rounded">course-outlines/</code> directory
                                        <br />
                                        <span className="text-xs text-gray-600 italic">(You can name them anything - the system will match them by course code and term)</span>
                                    </li>
                                    <li>Upload the listings file again - it will automatically use the downloaded files and populate full course details</li>
                                </ol>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Make sure you save the page as an HTML file. The file should end with{' '}
                                <code className="bg-blue-100 px-1 rounded">.html</code>
                            </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                            <p className="text-sm font-medium text-green-800 mb-2">What will be extracted:</p>
                            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                                <li>Course code, name, and term</li>
                                <li>Instructor information</li>
                                <li>Schedule (days, time, location)</li>
                                <li>Course description and learning outcomes</li>
                                <li>Assessments and due dates</li>
                                <li>Required materials and readings</li>
                                <li>Course policies</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Upload Course Outline
                </h2>

                <div className="space-y-4">
                    {/* File Input */}
                    <div>
                        <label
                            htmlFor="file-upload"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Select HTML File
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                ref={fileInputRef}
                                id="file-upload"
                                type="file"
                                accept=".html"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                        </div>
                        {file && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                                <span>{file.name}</span>
                                <span className="text-gray-400">
                                    ({(file.size / 1024).toFixed(2)} KB)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${!file || isUploading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isListingsFile
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isUploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {isListingsFile ? 'Processing...' : 'Uploading...'}
                            </>
                        ) : (
                            <>
                                {isListingsFile ? (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Process All Courses
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload Course Outline
                                    </>
                                )}
                            </>
                        )}
                    </button>

                    {/* Listings Preview */}
                    {isListingsFile && showListings && listings.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-blue-900">
                                    Found {listings.length} courses in listings file
                                </h3>
                                <button
                                    onClick={() => setShowListings(!showListings)}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                    {showListings ? 'Hide' : 'Show'} List
                                </button>
                            </div>
                            {showListings && (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {listings.map((listing, idx) => (
                                        <div key={idx} className="text-xs text-blue-800 bg-blue-100 p-2 rounded">
                                            <div className="font-medium">{listing.code}: {listing.title}</div>
                                            <div className="text-blue-600">{listing.term} - Sections: {listing.sections.join(', ')}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-3 text-xs text-blue-700">
                                <p className="font-medium mb-1">This will:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Use any saved HTML files from the <code className="bg-blue-100 px-1 rounded">course-outlines/</code> directory</li>
                                    <li>Parse each course outline to extract full details (assessments, materials, schedule, etc.)</li>
                                    <li>Add any new courses to your database with complete information</li>
                                    <li>Update existing courses if they already exist</li>
                                    <li>For courses without saved files, create basic entries from the listings</li>
                                </ul>
                                <p className="mt-2 text-blue-600 italic">
                                    <strong>Note:</strong> The system requires saved HTML files (downloaded manually) because outline.uwaterloo.ca uses Duo authentication.
                                    Files will be automatically matched by course code and term.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Status Message */}
                    {uploadStatus.type && (
                        <div
                            className={`p-4 rounded-lg flex items-start gap-3 ${uploadStatus.type === 'success'
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                                }`}
                        >
                            {uploadStatus.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p
                                    className={`text-sm ${uploadStatus.type === 'success'
                                        ? 'text-green-800'
                                        : 'text-red-800'
                                        }`}
                                >
                                    {uploadStatus.message}
                                </p>
                                {uploadStatus.type === 'success' && isListingsFile && listings.length > 0 && (
                                    <div className="mt-2 text-xs text-green-700">
                                        <p>To download all course outlines:</p>
                                        <ol className="list-decimal list-inside mt-1 space-y-1">
                                            <li>Open each course URL in your browser</li>
                                            <li>Save each page as HTML in the course-outlines/ directory</li>
                                            <li>Upload this listings file again to process all downloaded outlines</li>
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

