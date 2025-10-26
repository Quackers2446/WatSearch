# WatSearch

A centralized platform for integrating academic information from various University of Waterloo platforms (LEARN, Quest, Piazza, departmental websites) into a single searchable and queryable service.

## Features

- **🔍 Advanced Search**: Fuzzy search across courses, assignments, deadlines, and materials
- **📊 Dashboard**: Personalized overview with upcoming deadlines and course statistics
- **📚 Course Browser**: Comprehensive course information access with detailed views
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🎯 Smart Filters**: Filter by course type, assessment type, and date ranges

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
│   ├── course/[id]/        # Individual course pages
│   ├── courses/            # Course listing page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page with tabs
├── components/             # React components
│   ├── Navigation.tsx      # Tab-based navigation
│   ├── SearchInterface.tsx # Search functionality
│   ├── Dashboard.tsx        # Dashboard overview
│   └── CourseBrowser.tsx   # Course browsing
├── course-outlines/        # HTML course outline files
│   ├── Fall 2025_ *.html   # Course outline files
├── data/                   # Parsed course data
│   └── courses.json        # Course information
├── scripts/                # Data parsing scripts
│   └── parse-courses.js    # HTML parsing script
├── types/                  # TypeScript interfaces
│   └── index.ts            # Type definitions
└── [config files]         # Configuration files
```

## Data Sources

The application currently supports parsing course outline HTML files. To add your course data:

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## University of Waterloo

This application is designed specifically for University of Waterloo students and integrates with various UW platforms including LEARN, Quest, and Piazza.

---

**Note**: This is a student project and is not officially affiliated with the University of Waterloo.
