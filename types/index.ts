export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  sections: string[];
  instructor: {
    name: string;
    email: string;
    office?: string;
    officeHours?: string;
  };
  schedule: {
    days: string[];
    time: string;
    location: string;
  };
  description: string;
  learningOutcomes: string[];
  assessments: Assessment[];
  materials: Material[];
  policies: string[];
}

export interface Assessment {
  id: string;
  name: string;
  type: 'assignment' | 'exam' | 'quiz' | 'project' | 'lab';
  dueDate?: Date;
  weight: number;
  description?: string;
  location?: string;
  submissionMethod?: string;
}

export interface Material {
  id: string;
  title: string;
  type: 'textbook' | 'lecture_notes' | 'reading' | 'software' | 'other';
  required: boolean;
  price?: number;
  notes?: string;
  url?: string;
}

export interface Schedule {
  id: string;
  courseCode: string;
  courseName: string;
  day: string;
  time: string;
  location: string;
  instructor: string;
  type: 'lecture' | 'tutorial' | 'lab' | 'exam';
}

export interface Deadline {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  dueDate: Date;
  type: 'assignment' | 'exam' | 'quiz' | 'project';
  weight: number;
  description?: string;
  isUpcoming: boolean;
  daysUntilDue: number;
}

export interface SearchFilters {
  query?: string;
  courseCode?: string;
  type?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  upcoming?: boolean;
}
