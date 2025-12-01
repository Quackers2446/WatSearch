# WatSearch

A centralized platform for integrating academic information from various University of Waterloo platforms (LEARN, Quest, Piazza, departmental websites) into a single searchable and queryable service.

## Features

- **🔍 Advanced Search**: Fuzzy search across courses, assignments, deadlines, and materials
- **📊 Dashboard**: Personalized overview with upcoming deadlines and course statistics
- **📚 Course Browser**: Comprehensive course information access with detailed views
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🎯 Smart Filters**: Filter by course type, assessment type, and date ranges
- **🌐 Browser Extension**: Chrome extension for automatic data collection from UW platforms (LEARN, Quest, Piazza, Course Outlines)
- **📤 Easy Upload**: Upload course outline HTML files directly through the web interface

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS with custom University of Waterloo color scheme
- **Search**: Fuse.js for fuzzy search functionality
- **Icons**: Lucide React icons
- **Date Handling**: date-fns library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd WatSearch
```

2. Install dependencies:

```bash
npm install
```

3. Parse course data (if you have HTML course outlines):

```bash
npm run parse-courses
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
WatSearch/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── courses/        # Course data API
│   │   ├── upload-outline/ # Course outline upload API
│   │   └── process-listings/ # Batch processing API
│   ├── course/[id]/        # Individual course pages
│   ├── courses/            # Course listing page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page with tabs
├── browser-extension/     # Chrome extension for data collection
│   ├── manifest.json       # Extension manifest
│   ├── background.js       # Background service worker
│   ├── popup.html/js       # Extension popup UI
│   ├── outline-content.js  # Content script for outline.uwaterloo.ca
│   ├── enhanced-content.js # Content scripts for LEARN/Quest/Piazza
│   └── icons/              # Extension icons
├── components/             # React components
│   ├── Navigation.tsx      # Tab-based navigation
│   ├── SearchInterface.tsx # Search functionality
│   ├── Dashboard.tsx       # Dashboard overview
│   ├── CourseBrowser.tsx   # Course browsing
│   └── UploadOutline.tsx   # Course outline upload interface
├── course-outlines/        # HTML course outline files (legacy)
│   └── *.html              # Course outline files
├── data/                   # Parsed course data
│   └── courses.json        # Course information
├── scripts/                # Data parsing scripts
│   └── parse-courses.js    # HTML parsing script
├── types/                  # TypeScript interfaces
│   └── index.ts            # Type definitions
└── [config files]         # Configuration files
```

## Data Sources

The application supports multiple ways to add course data and materials:

### Option 1: Browser Extension (Recommended)

1. **Install the Browser Extension**:
    - See [browser-extension/README.md](browser-extension/README.md) for detailed instructions
    - Load the extension from the `browser-extension/` folder
    - Configure it to connect to your local WatSearch instance

2. **Use the Extension**:
    - Navigate to [outline.uwaterloo.ca](https://outline.uwaterloo.ca) and view your enrolled courses
    - Open the extension popup and select which terms to process
    - Click "Process Selected Course Outlines" to automatically extract and add all course details
    - The extension extracts HTML directly from authenticated pages and sends it to WatSearch

### Option 2: Manual Upload via Web Interface (Course Outlines)

1. Navigate to the "Upload" tab in WatSearch
2. Download a course outline from [outline.uwaterloo.ca](https://outline.uwaterloo.ca):
    - Search for your course
    - Click "View"
    - Right-click → "Save Page As" → Save as HTML
3. Upload the HTML file through the WatSearch upload interface
4. The course data will be automatically parsed and added

### Option 3: Upload Course Materials (ZIP → IndexedDB)

WatSearch can also ingest full course folders (e.g., LEARN downloads) and store all files locally in your browser for fast access:

1. Navigate to the **Upload** tab and choose the **Course Materials** sub‑tab.
2. **Create or obtain a ZIP**:
    - Download a LEARN “Course Package” ZIP, **or**
    - Zip a local course folder containing PDFs, HTML, spreadsheets, code, etc.
3. Select the corresponding course in WatSearch.
4. Upload the ZIP.
5. WatSearch will:
    - Unzip and classify files _client‑side_ (no raw files are sent to the server).
    - Store all file bytes in **IndexedDB** in your browser.
    - Expose everything through the **Files** tab, where you can search, sort, filter by course/category, preview, download, and delete local copies.

Course materials stay on your device; WatSearch only uses them to power search and browsing in your browser.

### Option 4: Batch Processing (Legacy)

1. Place HTML course outline files in the `course-outlines/` directory
2. Name them with the pattern: `Fall 2025_ [Course Name].html`
3. Run the parsing script: `npm run parse-courses`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run parse-courses` - Parse HTML course outlines

## Features Overview

### Search Interface

- Fuzzy search across all course content
- Real-time search results
- Advanced filtering options
- Mobile-responsive design

### Dashboard

- Upcoming deadlines overview
- Course statistics
- Quick access to important information
- Calendar integration ready

### Course Browser

- Browse all courses with detailed information
- Expandable course details
- Access to materials and policies
- Individual course pages

### Files

- Unified browser for all uploaded course materials
- Search by filename, path, and category (assignment, exam, lab, tutorial, etc.)
- Filter by course and file type
- Sort by name, category, date, or course
- Inline previews for PDFs, images, and text
- Download and delete files stored in your local IndexedDB

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Browser Extension

WatSearch includes a Chrome browser extension that makes it easy to collect course data from University of Waterloo platforms. The extension:

- **Automatically extracts** course outlines from `outline.uwaterloo.ca`
- **Supports term filtering** to process only selected semesters
- **Sends data directly** to your local WatSearch instance
- **Works with authenticated sessions** (no manual file downloads needed)
- **Provides progress tracking** and cancellation options

For detailed installation and usage instructions, see [browser-extension/README.md](browser-extension/README.md).

The extension is ready for Chrome Web Store submission and follows Manifest V3 best practices.

## University of Waterloo

This application is designed specifically for University of Waterloo students and integrates with various UW platforms including LEARN, Quest, Piazza, and Course Outlines.

---

**Note**: This is a student project and is not officially affiliated with the University of Waterloo.
