// Configuration for WatSearch Browser Extension

const WATSEARCH_CONFIG = {
  // Extraction settings
  maxPages: 20, // Maximum number of pages to visit
  maxDepth: 3, // Maximum depth to follow links
  delayBetweenRequests: 1000, // Delay between requests (ms)

  // Content types to extract
  contentTypes: {
    assignments: true,
    announcements: true,
    quizzes: true,
    exams: true,
    content: true,
    discussions: true,
  },

  // Site-specific settings
  sites: {
    LEARN: {
      enabled: true,
      followLinks: true,
      extractAssignments: true,
      extractAnnouncements: true,
      extractContent: true,
      selectors: {
        courseTitle: ".d2l-page-header h1",
        assignmentLinks:
          'a[href*="assignment"], a[href*="quiz"], a[href*="exam"]',
        announcementLinks: 'a[href*="announcement"], a[href*="news"]',
        contentLinks: 'a[href*="/content/"], a[href*="/lessons/"]',
      },
    },
    Quest: {
      enabled: true,
      followLinks: false,
      extractSchedule: true,
      extractGrades: true,
    },
    Piazza: {
      enabled: true,
      followLinks: false,
      extractPosts: true,
      extractDiscussions: true,
    },
  },

  // WatSearch API settings
  api: {
    baseUrl: "http://localhost:3000",
    endpoints: {
      courses: "/api/courses",
      health: "/api/health",
    },
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
  },

  // UI settings
  ui: {
    showNotifications: true,
    notificationDuration: 5000,
    showProgress: true,
  },
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = WATSEARCH_CONFIG;
} else {
  window.WATSEARCH_CONFIG = WATSEARCH_CONFIG;
}
