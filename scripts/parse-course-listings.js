const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/**
 * Parse the course listings HTML file to extract all courses with their View links
 */
function parseCourseListings(htmlFilePath) {
  const html = fs.readFileSync(htmlFilePath, 'utf8');
  const $ = cheerio.load(html);
  const courses = [];

  // Find all term sections (e.g., "Fall 2025", "Spring 2025")
  // They're in h3 elements with class "text-xl" inside divs with class "border"
  $('div.border').each((_, borderDiv) => {
    const termHeader = $(borderDiv).find('h3.text-xl');
    if (termHeader.length === 0) return;
    
    const term = termHeader.text().trim();
    
    // Find the table that follows this header
    const table = $(borderDiv).find('table tbody');
    
    table.find('tr').each((_, row) => {
      const cells = $(row).find('td');
      
      if (cells.length >= 4) {
        // Extract course code
        const code = cells.eq(0).find('span').text().trim();
        
        // Extract course title (may be hidden on mobile)
        const title = cells.eq(1).text().trim();
        
        // Extract sections
        const sectionsText = cells.eq(2).text().trim();
        const sections = sectionsText.split(',').map(s => s.trim());
        
        // Extract View link
        const viewLink = cells.eq(3).find('a[href*="/viewer/view/"]').attr('href');
        
        if (code && viewLink) {
          // Extract the outline ID from the URL
          const outlineIdMatch = viewLink.match(/\/viewer\/view\/([^/]+)/);
          const outlineId = outlineIdMatch ? outlineIdMatch[1] : '';
          
          // Get full URL
          const fullUrl = viewLink.startsWith('http') 
            ? viewLink 
            : `https://outline.uwaterloo.ca${viewLink}`;
          
          courses.push({
            code,
            title,
            term,
            sections,
            viewUrl: fullUrl,
            outlineId
          });
        }
      }
    });
  });

  return courses;
}

/**
 * Main function to process the course listings file
 */
function main() {
  const listingsFilePath = path.join(__dirname, '../course-outlines/Outline.uwaterloo.ca.html');
  
  if (!fs.existsSync(listingsFilePath)) {
    console.error(`File not found: ${listingsFilePath}`);
    process.exit(1);
  }

  console.log('Parsing course listings...');
  const courses = parseCourseListings(listingsFilePath);
  
  console.log(`\nFound ${courses.length} courses:\n`);
  
  // Group by term
  const coursesByTerm = courses.reduce((acc, course) => {
    if (!acc[course.term]) {
      acc[course.term] = [];
    }
    acc[course.term].push(course);
    return acc;
  }, {});

  // Display summary
  Object.entries(coursesByTerm).forEach(([term, termCourses]) => {
    console.log(`${term}: ${termCourses.length} courses`);
    termCourses.forEach(course => {
      console.log(`  - ${course.code}: ${course.title}`);
      console.log(`    Sections: ${course.sections.join(', ')}`);
      console.log(`    View: ${course.viewUrl}`);
    });
    console.log();
  });

  // Save the course listings as JSON
  const outputPath = path.join(__dirname, '../data/course-listings.json');
  fs.writeFileSync(outputPath, JSON.stringify(courses, null, 2));
  console.log(`\nCourse listings saved to: ${outputPath}`);

  // Also create a JSON file with just the URLs for easy programmatic access
  const urlsPath = path.join(__dirname, '../data/course-urls.json');
  const urls = courses.map(c => ({
    code: c.code,
    title: c.title,
    term: c.term,
    url: c.viewUrl,
    outlineId: c.outlineId,
    sections: c.sections
  }));
  fs.writeFileSync(urlsPath, JSON.stringify(urls, null, 2));
  console.log(`Course URLs saved to: ${urlsPath}`);
  
  console.log('\nNext steps:');
  console.log('1. You can manually download each course outline by visiting the URLs');
  console.log('2. Or use a browser extension to batch download them');
  console.log('3. Then use the existing upload functionality to parse each outline');
}

if (require.main === module) {
  main();
}

module.exports = { parseCourseListings };

