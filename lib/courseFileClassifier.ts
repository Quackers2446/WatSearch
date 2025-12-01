/**
 * File category classification for course files.
 * Uses rule-based matching on relative paths and filenames.
 */

export type FileCategory =
  | "assignment"
  | "assignment_solution"
  | "quiz"
  | "quiz_overview"
  | "synchronous_session_info"
  | "lab_manual"
  | "lab_data"
  | "lab_info"
  | "lecture_notes"
  | "module_page"
  | "tutorial"
  | "tutorial_solution"
  | "exam_midterm"
  | "exam_midterm_solution"
  | "exam_final"
  | "exam_final_solution"
  | "syllabus"
  | "course_admin"
  | "code_asset"
  | "media_asset"
  | "reference"
  | "misc";

/**
 * Classifies a course file based on its relative path.
 * 
 * @param relativePath - The relative path of the file (e.g., "toc/modules/week03.html")
 * @returns The assigned FileCategory
 */
export function classifyCourseFile(relativePath: string): FileCategory {
  // Normalize path: replace backslashes with forward slashes
  const normalizedPath = relativePath.replace(/\\/g, "/");
  
  // Split into segments
  const segments = normalizedPath.split("/").filter(s => s.length > 0);
  
  // Extract filename and extension
  const filename = segments[segments.length - 1] || "";
  const ext = filename.includes(".") 
    ? filename.substring(filename.lastIndexOf(".") + 1).toLowerCase()
    : "";
  const nameWithoutExt = filename.includes(".")
    ? filename.substring(0, filename.lastIndexOf("."))
    : filename;
  
  // Normalize name for matching: lowercase, remove spaces
  const name = nameWithoutExt.toLowerCase().replace(/\s+/g, "");
  const fullName = normalizedPath.toLowerCase().replace(/\s+/g, "");
  
  // Detect context folders
  const inToc = segments.includes("toc");
  const inActivities = segments.includes("activities-and-assignments");
  const inSyllabus = segments.includes("syllabus");
  const inModules = segments.includes("modules");
  const inCode = segments.includes("code");
  const inMedia = segments.includes("media");
  
  // Helper: check if name contains solution keywords
  const hasSolutionsWord = 
    name.includes("solution") || 
    name.includes("solutions") || 
    name.includes("sols") ||
    name.includes("_sol") ||
    name.includes("sol_");
  
  // Assets by folder (highest priority)
  if (inCode) {
    return "code_asset";
  }
  
  if (inMedia) {
    return "media_asset";
  }
  
  // HTML course shell pages
  if (ext === "html") {
    if (inToc && inActivities) {
      if (name.includes("quiz")) {
        return "quiz_overview";
      }
      if (name.includes("final-exam") || name.includes("finalexam") || name.includes("final_exam")) {
        return "exam_final";
      }
      if (name.includes("assignment")) {
        return "assignment";
      }
      if (name.includes("synchronous")) {
        return "synchronous_session_info";
      }
      return "course_admin";
    }
    
    if (inToc && inSyllabus) {
      return "syllabus";
    }
    
    if (inToc && inModules) {
      // Check if it's a weekXX.html pattern
      if (/^week\d+\.html$/i.test(filename) || /^week\d+$/i.test(name)) {
        return "module_page";
      }
    }
    
    if (name.includes("tableofcontents") || name.includes("toc") || filename.toLowerCase() === "table of contents.html") {
      return "course_admin";
    }
  }
  
  // Exams (PDFs, etc.)
  const hasMidterm = name.includes("midterm") || fullName.includes("midterm");
  const hasFinal = name.includes("final") || fullName.includes("final");
  
  // Special handling for M1&2_solutions.pdf style
  if (hasSolutionsWord && (name.startsWith("m1") || name.startsWith("m2") || name.includes("midterm"))) {
    if (hasMidterm || name.startsWith("m1") || name.startsWith("m2")) {
      return "exam_midterm_solution";
    }
  }
  
  if (hasMidterm && hasSolutionsWord) {
    return "exam_midterm_solution";
  }
  
  if (hasMidterm) {
    return "exam_midterm";
  }
  
  if (hasFinal && hasSolutionsWord) {
    return "exam_final_solution";
  }
  
  if (hasFinal) {
    return "exam_final";
  }
  
  // Handle patterns like "midterm_and_space_380S2024.pdf"
  if (fullName.includes("midterm") && !hasSolutionsWord) {
    return "exam_midterm";
  }
  
  if (fullName.includes("final") && !hasSolutionsWord && !name.includes("finalexam")) {
    return "exam_final";
  }
  
  // Assignments / solutions
  const hasAssign = 
    name.includes("assignment") || 
    /^a\d/.test(name) || 
    name.startsWith("a1") || 
    name.startsWith("a2") ||
    name.startsWith("a3") ||
    name.startsWith("a4") ||
    name.startsWith("a5") ||
    name.startsWith("a6") ||
    name.startsWith("a7") ||
    name.startsWith("a8") ||
    name.startsWith("a9");
  
  if (hasAssign && hasSolutionsWord) {
    return "assignment_solution";
  }
  
  if (hasAssign) {
    return "assignment";
  }
  
  // Labs (SE380 style)
  const hasLab = name.includes("lab");
  const hasMeasure = name.includes("measurement") || name.includes("measure");
  const hasCalendar = name.includes("calendar");
  const hasSafety = name.includes("safety");
  const hasQuiz = name.includes("quiz");
  
  if (hasLab) {
    if (name.includes("manual") || name.includes("presentation") || name.includes("outline")) {
      return "lab_manual";
    }
    if (hasMeasure || name.includes("plantidresults") || name.includes("plantid")) {
      return "lab_data";
    }
    if (hasCalendar || hasSafety || hasQuiz || name.includes("info") || name.includes("information")) {
      return "lab_info";
    }
  }
  
  // Tutorials (check before generic solution fallback)
  if (name.includes("tutorial")) {
    if (hasSolutionsWord) {
      return "tutorial_solution";
    }
    return "tutorial";
  }
  
  // If hasSolutionsWord alone (not caught above by exams, assignments, or tutorials)
  if (hasSolutionsWord && !hasMidterm && !hasFinal && !hasAssign) {
    return "assignment_solution";
  }
  
  // Lecture notes / chapters / course notes
  const hasChapter = name.startsWith("chapter") || name.startsWith("ch");
  if (hasChapter || name.includes("notes") || name.includes("lecture")) {
    return "lecture_notes";
  }
  
  // Reference material
  const referenceKeywords = [
    "datasheet",
    "parametersetup",
    "refresher",
    "help",
    "tikiscope",
    "design_of_decoupled_pid",
    "s41598",
    "paper",
    "article",
    "journal"
  ];
  
  if (referenceKeywords.some(keyword => name.includes(keyword) || fullName.includes(keyword))) {
    return "reference";
  }
  
  // Course admin
  const adminKeywords = [
    "calendar",
    "outline",
    "projectschedule",
    "courseschedule",
    "assignmentandprojectdates",
    "schedule"
  ];
  
  if (adminKeywords.some(keyword => name.includes(keyword) || fullName.includes(keyword))) {
    return "course_admin";
  }
  
  // Generic asset-type fallbacks by extension
  if (["css", "js", "ts", "tsx", "jsx", "json", "xml"].includes(ext)) {
    return "code_asset";
  }
  
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"].includes(ext)) {
    return "media_asset";
  }
  
  // PDF with long number sequence (like DOI or paper id)
  if (ext === "pdf") {
    const longNumberPattern = /[0-9]{4,}/;
    if (longNumberPattern.test(name) && !hasMidterm && !hasFinal && !hasAssign && !hasLab) {
      return "reference";
    }
  }
  
  // Final fallback
  return "misc";
}

