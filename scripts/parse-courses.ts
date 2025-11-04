import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { Course, Assignment, Reading } from '../types';

const coursesDirectory = path.join(__dirname, '../');

async function parseCourseOutline(filePath: string): Promise<Course | null> {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract basic course info
    const courseCode = $('.outline-courses').text().trim();
    const term = $('.outline-term').text().trim();
    const title = $('.outline-title-full').text().trim();
    
    // Extract sections
    const sections: string[] = [];
    $('.section').each((_: number, el: cheerio.Element) => {
      sections.push($(el).text().trim());
    });
    
    // Extract instructor info
    const instructorName = $('.instructor-info span').first().text().trim();
    const instructorEmail = $('.instructor-info small a').first().attr('href')?.replace('mailto:', '') || '';
    const instructorOffice = $('.instructor-info').text().includes('Office:') ? 
      $('.instructor-info').text().split('Office:')[1]?.split('\n')[0]?.trim() : undefined;
    
    // Extract schedule
    const scheduleDays: string[] = [];
    $('.days-visual span.present').each((_: number, el: cheerio.Element) => {
      scheduleDays.push($(el).text().trim().replace(',', ''));
    });
    const scheduleTime = $('td').filter((_: number, el: cheerio.Element) => 
      $(el).text().includes('PM') || $(el).text().includes('AM')
    ).first().text().trim();
    const location = $('td').filter((_: number, el: cheerio.Element) => 
      $(el).text().includes('MC') || $(el).text().includes('DC') || $(el).text().includes('EV')
    ).first().text().trim();

    // Extract course description
    const description = $('#course_description').nextAll('.dynamic-component, .html-block').first().text().trim();

    // Extract learning outcomes
    const learningOutcomes: string[] = [];
    $('#learning_outcomes + .multitable-container .multitable tbody tr td').each((_: number, el: cheerio.Element) => {
      learningOutcomes.push($(el).text().trim());
    });

    // Extract assessments
    const assessments: Assignment[] = [];
    $('#assessments_amp_activities + .multitable-container .multitable tbody tr').each((_: number, el: cheerio.Element) => {
      const cells = $(el).find('td');
      if (cells.length >= 4) {
        const name = cells.eq(0).text().trim();
        const dueDate = cells.eq(1).text().trim();
        const location = cells.eq(2).text().trim();
        const weight = parseFloat(cells.eq(3).text().trim());
        
        if (name && !isNaN(weight)) {
          assessments.push({
            id: `${courseCode}-${name.toLowerCase().replace(/\s+/g, '-')}`,
            name,
            type: name.toLowerCase().includes('exam') ? 'exam' : 'assignment',
            weight,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            description: location
          });
        }
      }
    });

    // Extract materials
    const materials: Reading[] = [];
    $('#readings + .multitable-container .multitable tbody tr').each((_: number, el: cheerio.Element) => {
      const cells = $(el).find('td');
      if (cells.length >= 3) {
        const title = cells.eq(0).text().trim();
        const notes = cells.eq(1).text().trim();
        const required = cells.eq(2).text().trim().toLowerCase() === 'yes';
        
        if (title) {
          materials.push({
            id: `${courseCode}-${title.toLowerCase().replace(/\s+/g, '-')}`,
            title,
            type: 'textbook',
            required,
            notes
          });
        }
      }
    });

    // Extract policies
    const policies: string[] = [];
    $('#late_missed_content + .html-block p').each((_: number, el: cheerio.Element) => {
      policies.push($(el).text().trim());
    });

    return {
      id: courseCode.replace(/\s/g, '') + term.replace(/\s/g, ''),
      code: courseCode,
      name: title,
      term,
      sections,
      instructor: {
        name: instructorName,
        email: instructorEmail,
        office: instructorOffice
      },
      schedule: {
        days: scheduleDays,
        time: scheduleTime,
        location
      },
      description,
      learningOutcomes,
      assessments,
      materials,
      policies
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

async function parseAllCourses() {
  const courseFiles = fs.readdirSync(coursesDirectory).filter(file => 
    file.endsWith('.html') && file.startsWith('Fall 2025_')
  );
  const parsedCourses: Course[] = [];

  for (const file of courseFiles) {
    const filePath = path.join(coursesDirectory, file);
    const course = await parseCourseOutline(filePath);
    if (course) {
      parsedCourses.push(course);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, '../data/courses.json'), 
    JSON.stringify(parsedCourses, null, 2)
  );
  console.log('Parsed courses saved to data/courses.json');
}

parseAllCourses();