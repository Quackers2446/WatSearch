import { Course, Assessment, Material } from "@/types"
import { Course as OutlineCourse } from "@/app/courses/courses"

/**
 * Convert course outline data to Course type used by the app
 */
export function convertOutlineToCourse(outline: OutlineCourse): Course {
    // Validate outline structure
    if (!outline || !outline.content) {
        throw new Error("Invalid course outline: missing content")
    }
    
    // Extract instructor info from HTML
    const instructorInfo = extractInstructorInfo(outline.content.instructor_info)
    
    // Extract learning outcomes
    const learningOutcomes: string[] = []
    if (outline.content.learning_outcomes && Array.isArray(outline.content.learning_outcomes)) {
        outline.content.learning_outcomes.forEach((outcomeGroup) => {
            if (outcomeGroup.data && Array.isArray(outcomeGroup.data)) {
                outcomeGroup.data.forEach((item) => {
                    if (item.outcome) {
                        learningOutcomes.push(item.outcome)
                    }
                })
            }
        })
    }
    
    // Extract assessments
    const assessments: Assessment[] = []
    if (outline.content.student_assessment && Array.isArray(outline.content.student_assessment)) {
        outline.content.student_assessment.forEach((assessmentGroup) => {
            if (assessmentGroup.data && Array.isArray(assessmentGroup.data)) {
                assessmentGroup.data.forEach((item, index) => {
                    const dueDate = parseDate(item.date)
                    const weight = parseWeight(item.value)
                    
                    assessments.push({
                        id: `${outline.id}-assessment-${index}`,
                        name: item.component || "Assessment",
                        type: determineAssessmentType(item.component),
                        dueDate: dueDate || undefined,
                        weight: weight,
                        description: item.submission || undefined,
                    })
                })
            }
        })
    }
    
    // Extract materials
    const materials: Material[] = []
    
    // Required materials
    if (outline.content.required_materials && Array.isArray(outline.content.required_materials)) {
        outline.content.required_materials.forEach((materialGroup) => {
            if (materialGroup.data && Array.isArray(materialGroup.data)) {
                materialGroup.data.forEach((item, index) => {
                    materials.push({
                        id: `${outline.id}-required-${index}`,
                        title: item.component || "Material",
                        type: "textbook",
                        required: item.required === "Required",
                        price: parsePrice(item.cost),
                        notes: item.comment || undefined,
                    })
                })
            }
        })
    }
    
    // Ed tech
    if (outline.content.ed_tech && Array.isArray(outline.content.ed_tech)) {
        outline.content.ed_tech.forEach((techGroup) => {
            if (techGroup.data && Array.isArray(techGroup.data)) {
                techGroup.data.forEach((item, index) => {
                    materials.push({
                        id: `${outline.id}-edtech-${index}`,
                        title: techGroup.header || "Ed Tech",
                        type: "software",
                        required: item.required === "Required",
                        price: parsePrice(item.cost),
                        notes: item.comment || undefined,
                        url: item.url || undefined,
                    })
                })
            }
        })
    }
    
    // Extract policies
    const policies: string[] = []
    if (outline.content.late_missed_content) {
        policies.push(stripHtml(outline.content.late_missed_content))
    }
    if (outline.content.assignment_screening) {
        policies.push(stripHtml(outline.content.assignment_screening))
    }
    if (outline.content.gen_ai) {
        policies.push(stripHtml(outline.content.gen_ai))
    }
    if (outline.content.local_policy) {
        policies.push(stripHtml(outline.content.local_policy))
    }
    
    // Extract term from course code or use default
    const term = extractTerm(outline.content.course_schedule) || "Fall 2025"
    
    return {
        id: `outline-${outline.id}`,
        code: outline.courses || "Unknown",
        name: extractCourseName(outline.content.course_description) || outline.courses || "Unknown Course",
        term: term,
        sections: outline.sections ? [outline.sections] : undefined,
        instructor: {
            name: instructorInfo.name || "TBA",
            email: instructorInfo.email || "",
            office: instructorInfo.office,
            officeHours: instructorInfo.officeHours,
        },
        schedule: {
            days: [],
            time: "",
            location: "",
        },
        description: stripHtml(outline.content.course_description) || "",
        learningOutcomes: learningOutcomes,
        assessments: assessments,
        materials: materials,
        policies: policies,
    }
}

function extractInstructorInfo(html: string): {
    name: string
    email: string
    office?: string
    officeHours?: string
} {
    if (!html) {
        return { name: "", email: "" }
    }
    
    let name = ""
    
    // Strategy 1: Look for "Course instructors" or "Course instructor" header
    const courseInstructorsMatch = html.match(/<h3>Course instructors?<\/h3>/i)
    if (courseInstructorsMatch) {
        // Get the content after the header
        const afterHeader = html.substring(courseInstructorsMatch.index! + courseInstructorsMatch[0].length)
        // Look for the first <strong> tag with a name
        const nameInStrong = afterHeader.match(/<strong>([^<]+)<\/strong>/)
        if (nameInStrong) {
            name = nameInStrong[1].trim()
        }
    }
    
    // Strategy 2: Try "Instructor:" format
    if (!name) {
        const nameMatch = html.match(/Instructor:\s*<\/strong>([^<,]+)/i) || 
                         html.match(/Instructor:\s*([^<,]+)/i) ||
                         html.match(/<strong>Instructor:&nbsp;<\/strong>([^<,]+)/i)
        if (nameMatch) {
            name = nameMatch[1].trim()
        }
    }
    
    // Strategy 3: Try "Name:" format
    if (!name) {
        const nameMatch = html.match(/Name:\s*([^<,]+)/i)
        if (nameMatch) {
            name = nameMatch[1].trim()
        }
    }
    
    // Strategy 4: Look for names in <strong> tags that appear before email addresses
    // This handles cases like "Prof. Kostadinka Bizheva (Course coordinator..."
    if (!name) {
        // Look for patterns like "Prof. Name" or just a name in <strong> followed by email
        const profNameMatch = html.match(/(?:Prof\.|Professor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i)
        if (profNameMatch) {
            name = profNameMatch[1].trim()
        } else {
            // Try to find a name in <strong> that appears before an email
            const strongBeforeEmail = html.match(/<strong>([^<]+)<\/strong>[^<]*<a[^>]*href="mailto:/i)
            if (strongBeforeEmail) {
                name = strongBeforeEmail[1].trim()
            }
        }
    }
    
    // Clean up the name
    if (name) {
        // Remove HTML entities
        name = name.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
        // Remove "Prof." or "Professor" prefix if present
        name = name.replace(/^(?:Prof\.|Professor)\s+/i, "")
        // Take only the part before the first comma or parenthesis (to get just the name, not credentials)
        const commaIndex = name.indexOf(",")
        const parenIndex = name.indexOf("(")
        const cutoffIndex = commaIndex > 0 && parenIndex > 0 
            ? Math.min(commaIndex, parenIndex)
            : commaIndex > 0 
                ? commaIndex 
                : parenIndex > 0 
                    ? parenIndex 
                    : name.length
        if (cutoffIndex > 0 && cutoffIndex < name.length) {
            name = name.substring(0, cutoffIndex).trim()
        }
    }
    
    // Extract email - try multiple formats
    const emailMatch = html.match(/Email:\s*<a[^>]*href="mailto:([^"]+)"/i) ||
                        html.match(/Email:&nbsp;<\/strong>([^<]+)/i) ||
                        html.match(/Email:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
                        // Look for email in mailto link near the instructor name
                        html.match(/<a[^>]*href="mailto:([^"]+)"[^>]*>([^<]+@[^<]+)<\/a>/i)
    
    // Extract office - try multiple formats
    const officeMatch = html.match(/Office Location:\s*([^<]+)/i) ||
                       html.match(/<strong>Office:&nbsp;<\/strong>([^<]+)/i) ||
                       html.match(/Office:\s*([^<]+)/i)
    
    // Extract office hours - try multiple formats
    const hoursMatch = html.match(/Office hours:\s*([^<]+)/i) ||
                      html.match(/Office Hours:\s*([^<]+)/i) ||
                      html.match(/<strong>Office Hours:&nbsp;<\/strong>([^<]+)/i)
    
    return {
        name: name,
        email: emailMatch ? (emailMatch[1] || emailMatch[2] || "").trim() : "",
        office: officeMatch ? officeMatch[1].trim().replace(/&nbsp;/g, " ") : undefined,
        officeHours: hoursMatch ? hoursMatch[1].trim().replace(/&nbsp;/g, " ").substring(0, 200) : undefined, // Limit length
    }
}

function extractCourseName(description: string): string | null {
    if (!description) return null
    
    // Try to extract course name from description
    const stripped = stripHtml(description)
    const sentences = stripped.split(".")
    if (sentences.length > 0 && sentences[0].length > 10) {
        return sentences[0].trim()
    }
    
    return null
}

function extractTerm(schedule: string): string | null {
    if (!schedule) return null
    
    // Try to extract term from schedule (e.g., "Fall 2025", "Winter 2025")
    const termMatch = schedule.match(/(Fall|Winter|Spring|Summer)\s+20\d{2}/i)
    if (termMatch) {
        return termMatch[0]
    }
    
    return null
}

function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.toLowerCase() === "weekly") {
        return null
    }
    
    // Try to parse dates like "October 29 @ 11:59pm"
    const dateMatch = dateStr.match(/(\w+\s+\d+)/)
    if (dateMatch) {
        const parsed = new Date(dateMatch[1])
        if (!isNaN(parsed.getTime())) {
            return parsed
        }
    }
    
    // Try standard date parsing
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
        return parsed
    }
    
    return null
}

function parseWeight(weightStr: string | undefined): number {
    if (!weightStr) return 0
    
    // Extract percentage (e.g., "25%" -> 25)
    const match = weightStr.match(/(\d+(?:\.\d+)?)/)
    if (match) {
        return parseFloat(match[1])
    }
    
    return 0
}

function parsePrice(priceStr: string | undefined): number | undefined {
    if (!priceStr) return undefined
    
    // Extract price (e.g., "$50.00" -> 50.00)
    const match = priceStr.match(/\$?(\d+(?:\.\d+)?)/)
    if (match) {
        return parseFloat(match[1])
    }
    
    return undefined
}

function determineAssessmentType(component: string | undefined): "assignment" | "exam" | "quiz" | "project" | "lab" {
    if (!component) return "assignment"
    
    const lower = component.toLowerCase()
    if (lower.includes("exam") || lower.includes("midterm") || lower.includes("final")) {
        return "exam"
    }
    if (lower.includes("quiz")) {
        return "quiz"
    }
    if (lower.includes("project")) {
        return "project"
    }
    if (lower.includes("lab")) {
        return "lab"
    }
    
    return "assignment"
}

function stripHtml(html: string | undefined): string {
    if (!html) return ""
    
    // Simple HTML tag removal
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim()
}

