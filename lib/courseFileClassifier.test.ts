/**
 * Test cases for course file classifier.
 * 
 * Run with: npx tsx lib/courseFileClassifier.test.ts
 * Or: npm test
 */

import { classifyCourseFile } from "./courseFileClassifier";

interface TestCase {
  path: string;
  expected: string;
  description?: string;
}

const testCases: TestCase[] = [
  // Assignments
  {
    path: "Assignment3_SE380_F25.pdf",
    expected: "assignment",
    description: "SE380 assignment file"
  },
  {
    path: "Solution3_SE380_F25_partial.pdf",
    expected: "assignment_solution",
    description: "Assignment solution"
  },
  {
    path: "A1_SE380_F25.pdf",
    expected: "assignment",
    description: "Assignment with A1 prefix"
  },
  
  // Labs
  {
    path: "SE_380_F25_Lab1_Manual.pdf",
    expected: "lab_manual",
    description: "Lab manual"
  },
  {
    path: "SE380_F25_Lab1_Measurements.xlsx",
    expected: "lab_data",
    description: "Lab measurements/data"
  },
  {
    path: "SE380 Lab 5_Information on Lab quiz.pdf",
    expected: "lab_info",
    description: "Lab information"
  },
  
  // Tutorials
  {
    path: "SE380_Tutorials-1.pdf",
    expected: "tutorial",
    description: "Tutorial file"
  },
  {
    path: "SE380_Tutorials-1-sols.pdf",
    expected: "tutorial_solution",
    description: "Tutorial solution"
  },
  
  // Exams
  {
    path: "SCI_238_S25_midterm_1_full.pdf",
    expected: "exam_midterm",
    description: "Midterm exam"
  },
  {
    path: "SCI_238_S25_final_full.pdf",
    expected: "exam_final",
    description: "Final exam"
  },
  {
    path: "M1&2_solutions.pdf",
    expected: "exam_midterm_solution",
    description: "Midterm solutions (M1&2 style)"
  },
  {
    path: "midterm_and_space_380S2024.pdf",
    expected: "exam_midterm",
    description: "Midterm with spaces in name"
  },
  {
    path: "final_and_space_380S2024.pdf",
    expected: "exam_final",
    description: "Final with spaces in name"
  },
  
  // HTML course shell pages
  {
    path: "toc/activities-and-assignments/quizzes.html",
    expected: "quiz_overview",
    description: "Quiz overview page"
  },
  {
    path: "toc/activities-and-assignments/final-exam.html",
    expected: "exam_final",
    description: "Final exam overview page"
  },
  {
    path: "toc/activities-and-assignments/assignment-x.html",
    expected: "assignment",
    description: "Assignment overview page"
  },
  {
    path: "toc/activities-and-assignments/synchronous-sessions.html",
    expected: "synchronous_session_info",
    description: "Synchronous session info"
  },
  {
    path: "toc/syllabus/course-schedule.html",
    expected: "syllabus",
    description: "Syllabus page"
  },
  {
    path: "toc/modules/week03.html",
    expected: "module_page",
    description: "Module/week page"
  },
  {
    path: "toc/modules/week12.html",
    expected: "module_page",
    description: "Another module page"
  },
  
  // Assets
  {
    path: "code/css/custom.css",
    expected: "code_asset",
    description: "CSS file in code folder"
  },
  {
    path: "media/images/niayesh-afshordi.png",
    expected: "media_asset",
    description: "Image in media folder"
  },
  
  // Reference material
  {
    path: "s41598-022-18335-0.pdf",
    expected: "reference",
    description: "Research paper with DOI-like number"
  },
  
  // Course admin
  {
    path: "Table of Contents.html",
    expected: "course_admin",
    description: "Table of contents"
  },
  {
    path: "course-schedule.pdf",
    expected: "course_admin",
    description: "Course schedule"
  },
  
  // Edge cases
  {
    path: "solution.pdf",
    expected: "assignment_solution",
    description: "Generic solution file"
  },
  {
    path: "unknown_file.xyz",
    expected: "misc",
    description: "Unknown file type"
  },
];

function runTests() {
  console.log("Running classifier tests...\n");
  
  let passed = 0;
  let failed = 0;
  const failures: Array<{ path: string; expected: string; actual: string }> = [];
  
  for (const testCase of testCases) {
    const actual = classifyCourseFile(testCase.path);
    const success = actual === testCase.expected;
    
    if (success) {
      passed++;
      console.log(`✓ ${testCase.path}`);
      if (testCase.description) {
        console.log(`  → ${testCase.description}`);
      }
    } else {
      failed++;
      failures.push({
        path: testCase.path,
        expected: testCase.expected,
        actual: actual,
      });
      console.log(`✗ ${testCase.path}`);
      console.log(`  Expected: ${testCase.expected}`);
      console.log(`  Actual:   ${actual}`);
      if (testCase.description) {
        console.log(`  ${testCase.description}`);
      }
    }
    console.log("");
  }
  
  console.log("=".repeat(50));
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  
  if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => {
      console.log(`  ${f.path}`);
      console.log(`    Expected: ${f.expected}`);
      console.log(`    Actual:   ${f.actual}`);
    });
    process.exit(1);
  } else {
    console.log("\nAll tests passed! ✓");
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { testCases, runTests };

