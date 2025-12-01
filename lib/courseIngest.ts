/**
 * Course file ingestion module.
 * Recursively walks course directories and classifies files.
 */

import * as fs from "fs";
import * as path from "path";
import { classifyCourseFile, FileCategory } from "./courseFileClassifier";

export interface IngestedCourseFile {
  courseId: string;
  relativePath: string; // e.g. "toc/modules/week03.html"
  filename: string; // e.g. "week03.html"
  category: FileCategory;
  fullPath?: string; // Full file system path (for uploading to Storage)
}

/**
 * Recursively walks a directory and collects all files.
 * 
 * @param dir - The directory to walk
 * @param rootDir - The root directory (for computing relative paths)
 * @param files - Array to accumulate file paths
 */
function walkDirectory(
  dir: string,
  rootDir: string,
  files: string[]
): void {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recurse into subdirectories
        walkDirectory(fullPath, rootDir, files);
      } else if (entry.isFile()) {
        // Add file to list
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
}

/**
 * Ingests all files from a course folder and classifies them.
 * 
 * @param courseId - The course identifier (e.g., "SE380", "SCI238")
 * @param rootDir - The root directory of the course folder
 * @returns Promise resolving to an array of ingested file records
 */
export async function ingestCourseFolder(
  courseId: string,
  rootDir: string
): Promise<IngestedCourseFile[]> {
  // Resolve absolute path
  const absoluteRootDir = path.resolve(rootDir);
  
  // Check if directory exists
  if (!fs.existsSync(absoluteRootDir)) {
    throw new Error(`Directory does not exist: ${absoluteRootDir}`);
  }
  
  if (!fs.statSync(absoluteRootDir).isDirectory()) {
    throw new Error(`Path is not a directory: ${absoluteRootDir}`);
  }
  
  // Collect all files recursively
  const allFiles: string[] = [];
  walkDirectory(absoluteRootDir, absoluteRootDir, allFiles);
  
  // Process each file
  const ingestedFiles: IngestedCourseFile[] = [];
  const seenPaths = new Set<string>(); // Track seen relative paths to prevent duplicates
  
  for (const filePath of allFiles) {
    // Compute relative path
    const relativePath = path.relative(absoluteRootDir, filePath).replace(/\\/g, "/");
    
    // Extract filename
    const filename = path.basename(filePath);
    
    // Skip macOS metadata files
    // 1. Files starting with ._ (macOS resource fork files)
    if (filename.startsWith("._")) {
      continue;
    }
    
    // 2. Files in __MACOSX directories
    if (relativePath.includes("__MACOSX/") || relativePath.includes("__MACOSX\\")) {
      continue;
    }
    
    // 3. .DS_Store files (macOS folder metadata)
    if (filename === ".DS_Store") {
      continue;
    }
    
    // 4. Other hidden/system files starting with .
    if (filename.startsWith(".") && filename !== ".gitkeep" && filename !== ".gitignore") {
      continue;
    }
    
    // 5. Skip if we've already seen this relative path (prevent duplicates)
    if (seenPaths.has(relativePath)) {
      continue;
    }
    seenPaths.add(relativePath);
    
    // Classify the file
    const category = classifyCourseFile(relativePath);
    
    ingestedFiles.push({
      courseId,
      relativePath,
      filename,
      category,
      fullPath: filePath, // Store full path for uploading to Storage
    });
  }
  
  return ingestedFiles;
}

