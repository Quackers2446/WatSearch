# WatSearch Enhanced Browser Extension

## 🚀 Enhanced Features

The WatSearch browser extension now supports **link following** and **multi-page data extraction**! Instead of just looking at the current page, the extension can now:

- **Follow Links**: Automatically navigate to assignment pages, content pages, and announcements
- **Extract Deep Data**: Get detailed information from individual pages
- **Multi-Page Collection**: Collect data from up to 20 pages per course
- **Smart Prioritization**: Focus on high-priority content like assignments first

## 🔍 How It Works

### 1. **Table of Contents Analysis**

When you're on a LEARN course page, the extension:

1. Scans the table of contents for links
2. Identifies assignments, quizzes, exams, and content
3. Prioritizes high-value content (assignments first)

### 2. **Link Following**

The extension then:

1. Follows each link to get detailed information
2. Extracts specific data from each page
3. Combines all data into a comprehensive dataset

### 3. **Smart Data Extraction**

For each page visited, the extension extracts:

- **Assignments**: Title, description, due date, points
- **Announcements**: Title, content, date
- **Content**: Course materials, readings, resources

## 📊 What Data is Collected

### From LEARN Table of Contents:

- **Course Information**: Name, code, term
- **Assignment Links**: All assignments, quizzes, exams
- **Content Links**: Course materials, lessons, resources
- **Announcement Links**: Course announcements, news

### From Individual Pages:

- **Assignment Details**: Full descriptions, due dates, grading info
- **Announcement Content**: Complete announcement text and dates
- **Content Materials**: Readings, resources, course content

## ⚙️ Configuration

### Settings in `config.js`:

```javascript
const WATSEARCH_CONFIG = {
  maxPages: 20, // Maximum pages to visit
  maxDepth: 3, // Maximum link depth
  delayBetweenRequests: 1000, // Delay between requests

  contentTypes: {
    assignments: true, // Extract assignments
    announcements: true, // Extract announcements
    quizzes: true, // Extract quizzes
    exams: true, // Extract exams
    content: true, // Extract course content
    discussions: true, // Extract discussions
  },
};
```

## 🎯 Usage

### Automatic Enhanced Extraction:

1. **Navigate to LEARN Course**: Go to any LEARN course page
2. **Extension Activates**: The extension automatically detects the course
3. **Link Discovery**: Scans for assignments, content, and announcements
4. **Data Collection**: Follows links and extracts detailed information
5. **Send to WatSearch**: All data is sent to your WatSearch application

### Manual Enhanced Extraction:

1. **Open Extension Popup**: Click the WatSearch icon
2. **Click "Extract Course Data"**: Start the enhanced extraction
3. **Monitor Progress**: Watch as the extension visits multiple pages
4. **Send to WatSearch**: Send all collected data

## 📈 Enhanced Data Structure

The enhanced extension now collects:

```javascript
{
  site: "LEARN",
  timestamp: "2025-01-01T12:00:00.000Z",
  data: {
    courses: [...],           // Course information
    assignments: [...],       // All assignments with details
    announcements: [...],     // All announcements with content
    contentPages: [...],      // Data from individual pages
    totalPages: 15            // Number of pages visited
  }
}
```

## 🔧 Technical Details

### Link Following Process:

1. **Parse Table of Contents**: Extract all relevant links
2. **Prioritize Content**: Sort by importance (assignments first)
3. **Follow Links**: Visit each page and extract data
4. **Combine Results**: Merge all extracted data

### Error Handling:

- **Failed Requests**: Skip failed pages and continue
- **Rate Limiting**: Respect server limits with delays
- **Timeout Protection**: Prevent hanging requests

### Performance:

- **Concurrent Limits**: Maximum 3 concurrent requests
- **Memory Management**: Clean up after each page
- **Progress Tracking**: Show extraction progress

## 🚨 Important Notes

### Privacy & Security:

- **Local Only**: All data stays on your computer
- **No External Servers**: Data is only sent to your local WatSearch
- **Respectful Scraping**: Uses delays to avoid overwhelming servers

### Limitations:

- **Login Required**: You must be logged into LEARN
- **Page Limits**: Maximum 20 pages per extraction
- **Time Limits**: Extraction may take 1-2 minutes for large courses

### Troubleshooting:

- **Slow Extraction**: Large courses may take time
- **Failed Pages**: Some pages may not be accessible
- **Memory Usage**: Large extractions may use more memory

## 🎉 Benefits

### For Students:

- **Complete Course Data**: Get all assignments, announcements, and content
- **No Manual Work**: Automatically extracts everything
- **Comprehensive View**: See your entire course at a glance

### For WatSearch:

- **Rich Data**: Much more detailed course information
- **Better Search**: More content to search through
- **Complete Picture**: Full course overview

## 🔄 Migration from Basic Extension

The enhanced extension is **backward compatible**:

- **Same Installation**: Use the same installation process
- **Same Interface**: Popup interface remains the same
- **Enhanced Data**: Just collects more data automatically

## 📝 Example Output

After running the enhanced extraction on a LEARN course, you'll get:

```javascript
{
  courses: [
    {
      name: "SE 380 - Software Design and Architectures",
      code: "SE 380",
      term: "Fall 2025"
    }
  ],
  assignments: [
    {
      title: "Assignment 1",
      description: "Design a software architecture...",
      dueDate: "October 15, 2025",
      points: "100",
      url: "https://learn.uwaterloo.ca/.../assignment1"
    },
    // ... more assignments
  ],
  announcements: [
    {
      title: "Course Update",
      content: "Please note the following changes...",
      date: "October 1, 2025"
    }
    // ... more announcements
  ],
  contentPages: [
    {
      url: "https://learn.uwaterloo.ca/.../lesson1",
      title: "Introduction to Software Design",
      content: "In this lesson, we will cover..."
    }
    // ... more content pages
  ],
  totalPages: 15
}
```

This gives you a **complete picture** of your course with all the details you need for WatSearch! 🎯
