import fs from "fs/promises"

const __dirname = import.meta.dirname

export interface Course {
    id: number
    view_url: string
    courses: string
    sections: string
    content: Content
}

export interface Content {
    instructor_info: string
    course_description: string
    learning_outcomes: LearningOutcome[]
    learning_outcomes_extra: string
    course_schedule: string
    cost_estimate_notice: CostEstimateNotice
    cost_statement: CostStatement | ""
    required_materials: RequiredMaterial[]
    required_materials_extra: string
    ed_tech: EdTech[] | ""
    ed_tech_extra: string
    other_materials: OtherMaterials[] | ""
    other_materials_extra: string
    student_assessment: StudentAssessment[]
    student_assessment_extra: string
    late_missed_content: string
    assignment_screening: string
    gen_ai: string
    recording_notice: string
    local_policy: string
}

export interface LearningOutcome {
    data: {
        outcome: string
    }[]
    footer?: string
    header: string
}

export interface CostStatement {
    key: "has_cost" | "no_cost"
    content: string
}

export type Required =
    | "Required"
    | "Recommended"
    | "Optional / Supplemental"
    | ""

export interface EdTech {
    data: {
        url: string
        cost: string
        comment: string
        required: Required
    }[]
    header: string
    footer: string
}

export interface OtherMaterials {
    data: {
        cost: string
        comment: string
        required: Required
        component: string
    }[]
    header: string
    footer: string
}

export interface CostEstimateNotice {
    hash?: string
    content: string
    content_id?: number
    content_ts: string
}

export interface RequiredMaterial {
    data: {
        cost: string
        comment: string
        required: Required
        component: string
        used_allowed: boolean
    }[]
    header?: string
    footer?: string
}

export interface StudentAssessment {
    data: {
        date?: string
        value: string
        component: string
        submission?: string
    }[]
    footer?: string
    header?: string
}

export const courses: { [id: string]: Course } = {}
/**
 * Promise unresolved: pending
 * Promise resolved with `false`: courses could not be initialized
 * Promise resolved with `true`: courses initialized
 */
export const coursesInitialized: Promise<boolean> = new Promise(
    async (resolve, reject) => {
        try {
            if (process.env.NODE_ENV === "production") {
                resolve(true)
            } else {
                // This will basically inline the JSON data into the compiled code.
                // The transpiler should be smart enough to remove it when process.env.NODE_ENV === "production".
                // const data = await import("./course-outlines.json")
                // for (const item of Object.values(data)) {
                //     courses[item.id] = item
                // }
                // resolve(true)
            }
        } catch (err) {
            console.error(err)
            resolve(false)
        }
    },
)
