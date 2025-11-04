# Course Outline Extraction from Listings

This set of scripts allows you to extract course information from the `Outline.uwaterloo.ca.html` file that contains all your enrolled courses.

## Overview

The process involves:
1. **Parsing the course listings** - Extract all course codes, titles, terms, and View URLs
2. **Downloading course outlines** - Get the HTML files for each course outline
3. **Batch processing** - Parse all downloaded outlines and add them to your courses database

## Step 1: Parse Course Listings

Run the script to extract all course information from your saved `Outline.uwaterloo.ca.html` file:

```bash
node scripts/parse-course-listings.js
```

This will:
- Parse the HTML file at `course-outlines/Outline.uwaterloo.ca.html`
- Extract all courses with their codes, titles, terms, sections, and View URLs
- Save the results to:
  - `data/course-listings.json` - Full course listing data
  - `data/course-urls.json` - Simplified course URLs for easy access

**Output:** A summary showing all courses found, grouped by term.

## Step 2: Download Course Outlines

For each course, you need to download the actual course outline HTML file. You have a few options:

### Option A: Manual Download (Recommended for small batches)
1. Open `data/course-urls.json` to see all the URLs
2. For each course:
   - Open the URL in your browser
   - Go to File → Save Page As
   - Save as: `{CODE}_{TERM}_{OUTLINE_ID}.html` (e.g., `CS343_Fall_2025_nc7p8w.html`)
   - Save in the `course-outlines/` directory

### Option B: Browser Extension (Recommended for many courses)
Use a browser extension like:
- **Download All Files** (Chrome/Firefox)
- **Bulk URL Opener** (to open all URLs, then save each)

Create a list of URLs from `data/course-urls.json` and use the extension to download them all.

### Option C: Automated Script (Advanced)
You could create a script using Puppeteer or similar to automate the downloads, but this requires handling authentication and may violate the website's terms of service.

## Step 3: Batch Process Outlines

Once you have downloaded all the course outline HTML files to the `course-outlines/` directory, run:

```bash
node scripts/batch-process-outlines.js
```

This will:
- Find all HTML files in `course-outlines/` (excluding the listings file)
- Parse each course outline using the same logic as the upload functionality
- Merge with existing courses in `data/courses.json`
- Update existing courses or add new ones

**Output:** A summary showing:
- How many courses were successfully parsed
- Any errors encountered
- Total courses in the database

## Example Workflow

```bash
# 1. Parse the listings file
node scripts/parse-course-listings.js

# Output: Found 30 courses across multiple terms

# 2. Download course outlines (manually or via extension)
# Save files to course-outlines/ directory

# 3. Batch process all downloaded outlines
node scripts/batch-process-outlines.js

# Output: Successfully parsed 30 courses, Total courses in database: 35
```

## Files Created

- `data/course-listings.json` - Full course listing data with all metadata
- `data/course-urls.json` - Simplified version with just URLs and basic info
- `data/courses.json` - Updated with all parsed courses (merged with existing)

## Notes

- The scripts preserve existing course data and only update/add courses as needed
- If a course with the same code and term already exists, it will be updated
- Failed parses are logged but don't stop the batch process
- Make sure downloaded HTML files are saved in the `course-outlines/` directory

## Troubleshooting

**Issue:** Script can't find the listings file
- Make sure `course-outlines/Outline.uwaterloo.ca.html` exists
- Check that you saved the file correctly from outline.uwaterloo.ca

**Issue:** Some courses fail to parse
- Make sure you downloaded the full HTML page (not just a screenshot)
- Check that the file is saved as HTML, not PDF or other format
- Some courses may have different HTML structures - check the error messages

**Issue:** Duplicate courses in database
- The merge logic checks for matching code + term
- If you have the same course from different sources, you may need to manually clean up

