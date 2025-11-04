# WatSearch Browser Extension

A Chrome/Edge extension that automatically extracts course data from University of Waterloo platforms (LEARN, Quest, Piazza, Course Outlines) and sends it to your local WatSearch application. The extension is ready for Chrome Web Store submission and follows Manifest V3 best practices.

## 🚀 Quick Start (5 minutes)

### Step 1: Install the Extension

1. **Open Chrome Extensions:**
    - Go to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
    - Enable "Developer mode" (toggle in top right corner)

2. **Load the Extension:**
    - Click "Load unpacked"
    - Navigate to your WatSearch project folder
    - Select the `browser-extension` folder
    - Click "Select Folder"

3. **Pin the Extension:**
    - Click the puzzle piece icon (🧩) in your browser toolbar
    - Find "WatSearch Data Collector"
    - Click the pin icon (📌) to keep it visible

### Step 2: Start WatSearch Application

1. **Open Terminal/Command Prompt:**

    ```bash
    cd /path/to/WatSearch
    npm run dev
    ```

2. **Note the Port:**
    - WatSearch will run on `http://localhost:3000` (or 3001, 3002 if 3000 is busy)
    - Check the terminal output for the exact URL

### Step 3: Configure the Extension

1. **Open Extension Popup:**
    - Click the WatSearch extension icon in your browser toolbar
    - You should see the popup interface

2. **Set WatSearch URL:**
    - In the "Settings" section, enter your WatSearch URL
    - Default: `http://localhost:3000`
    - If WatSearch is on a different port, update accordingly

3. **Test Connection:**
    - Click "Test Connection" to verify the extension can reach WatSearch
    - You should see "Connection test successful!"

## 🎯 How to Use

### Processing Course Outlines (Recommended)

1. **Navigate to Course Outlines:**
    - Go to [outline.uwaterloo.ca](https://outline.uwaterloo.ca) and log in
    - Navigate to your enrolled courses page (shows all your courses for the term)

2. **Open Extension Popup:**
    - Click the WatSearch extension icon in your browser toolbar
    - The extension will detect you're on the course listings page

3. **Select Terms and Process:**
    - Select which terms you want to process (defaults to most recent term)
    - Click "Process Selected Course Outlines"
    - The extension will automatically:
        - Extract course URLs for selected terms
        - Open each course outline in background tabs
        - Extract the full HTML content
        - Send it directly to your WatSearch API
        - Show progress and allow cancellation

4. **Monitor Progress:**
    - Watch the progress in the extension popup
    - See how many courses have been successfully processed
    - Cancel at any time if needed
    - Check your WatSearch application to see the imported courses

### Automatic Data Collection (LEARN, Quest, Piazza)

1. **Navigate to UW Sites:**
    - Go to [LEARN](https://learn.uwaterloo.ca) and log in
    - Go to [Quest](https://quest.uwaterloo.ca) and log in
    - Go to [Piazza](https://piazza.com) and log in

2. **Data is Extracted Automatically:**
    - The extension will show a notification when data is extracted
    - You'll see a red notification in the top-right corner of the page
    - The extension icon will show activity

3. **Send to WatSearch:**
    - Click the WatSearch extension icon
    - Click "Send to WatSearch" to sync the data
    - Check your WatSearch application to see the imported data

## 📊 What Data is Collected

### From Course Outlines (outline.uwaterloo.ca):

- **Course Information**: Code, name, term, instructor, sections
- **Schedule**: Lecture times, locations, instructors
- **Assessments**: Assignments, exams, quizzes, projects, labs with due dates and weights
- **Materials**: Textbooks, lecture notes, readings, software, lab manuals
- **Policies**: Academic policies, grading schemes, late policies
- **Deadlines**: All important dates and deadlines

### From LEARN:

- **Course Information**: Name, code, term, instructor
- **Assignments**: Title, due dates, points, descriptions
- **Announcements**: Title, content, dates
- **Course Materials**: Links to resources

### From Quest:

- **Course Schedule**: Times, locations, instructors
- **Course Information**: Codes, names, credits
- **Term Information**: Current semester details

### From Piazza:

- **Discussion Posts**: Title, content, author, date
- **Q&A Threads**: Questions and answers
- **Course Discussions**: All course-related posts

## 🔧 Troubleshooting

### Extension Not Appearing

- **Check Developer Mode**: Make sure "Developer mode" is enabled in `chrome://extensions/`
- **Reload Extension**: Click the refresh icon on the extension card
- **Check Console**: Open browser console (F12) for error messages

### "No Active Tab" Error

- **Refresh the Page**: Try refreshing the UW site you're on
- **Check Site Support**: Make sure you're on LEARN, Quest, or Piazza
- **Wait for Page Load**: Let the page fully load before using the extension

### Connection Test Failed

- **Check WatSearch is Running**: Make sure `npm run dev` is running
- **Check Port**: Verify the correct port in the extension settings
- **Check Firewall**: Ensure your firewall allows local connections

### Data Not Appearing in WatSearch

- **Check API Endpoint**: Visit `http://localhost:3000/api/health` in your browser
- **Check Console**: Look for errors in the WatSearch terminal
- **Try Different Port**: Update the WatSearch URL in extension settings

### Extension Popup Not Working

- **Reload Extension**: Go to `chrome://extensions/` and reload the extension
- **Check Permissions**: Ensure the extension has necessary permissions
- **Restart Browser**: Try closing and reopening your browser

## ⚙️ Settings

### WatSearch URL

- **Default**: `http://localhost:3000`
- **Alternative Ports**: `http://localhost:3001`, `http://localhost:3002`
- **Change**: Update in the extension popup settings

### Permissions

The extension requires permissions to:

- Access UW websites (LEARN, Quest, Piazza)
- Send data to your local WatSearch application
- Store configuration settings

## 🔒 Privacy & Security

- **Local Only**: All data stays on your computer
- **No External Servers**: Data is only sent to your local WatSearch application
- **No Credentials**: The extension doesn't store or access your login information
- **User Control**: You decide when to extract and send data

## 📱 Supported Browsers

- **Chrome**: Version 88+ (recommended)
- **Edge**: Version 88+ (Chromium-based)
- **Other Chromium Browsers**: Should work with Manifest V3 support

## 🆘 Need Help?

### Check the Logs

1. **Extension Console**: Open browser console (F12) for extension errors
2. **WatSearch Terminal**: Check WatSearch terminal for API errors
3. **Network Tab**: Check if API calls are being made

### Test Components

1. **Test WatSearch API**: Visit `http://localhost:3000/api/health`
2. **Test Extension Popup**: Click the extension icon
3. **Test Data Extraction**: Try on different UW sites

### Common Issues

1. **Port Conflicts**: Try different ports (3001, 3002)
2. **Site Layout Changes**: UW sites update frequently
3. **Login Requirements**: Make sure you're logged into UW sites

## 🎉 Success!

Once everything is working:

- Navigate to any UW site (LEARN, Quest, Piazza)
- The extension will automatically extract data
- Click "Send to WatSearch" to sync
- Check your WatSearch application to see the imported data
- Use WatSearch to search, browse, and manage your course information!

## 📝 Development

### File Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── content.js             # Data extraction script
├── background.js          # Communication handler
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── icons/                 # Extension icons
│   ├── icon16.png         # 16x16 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── README.md              # This file
```

### Adding New Sites

1. **Update manifest.json**: Add new host permissions
2. **Update content.js**: Add new site detection and extraction
3. **Update popup.js**: Add site recognition and UI elements

## 📦 Chrome Web Store Submission

The extension is ready for Chrome Web Store submission. Here's what's been prepared:

### ✅ Manifest V3 Compliance

- ✅ Uses Manifest V3 (`manifest_version: 3`)
- ✅ Service worker instead of background page
- ✅ Minimal permissions (only what's needed)
- ✅ No deprecated APIs
- ✅ Proper content security policy

### ✅ Required Assets

- ✅ Icons: 16x16, 48x48, 128x128 PNG files
- ✅ Short description (under 132 characters)
- ✅ Detailed description
- ✅ Screenshots (you'll need to add these)

### 📋 Submission Checklist

Before submitting to Chrome Web Store:

1. **Create Store Assets:**
    - [ ] **Screenshots**: 1280x800 or 640x400 (at least 1, up to 5)
    - [ ] **Promotional Images** (optional): 920x680 or 1400x560
    - [ ] **Small Promotional Tile**: 440x280
    - [ ] **Marquee Promotional Tile**: 920x680
    - [ ] **Icon**: 128x128 (already have)

2. **Prepare Store Listing:**
    - [ ] **Name**: "WatSearch Data Collector" (already set)
    - [ ] **Short Description**: "Collects course data from University of Waterloo platforms for WatSearch" (already set)
    - [ ] **Detailed Description**: Write a compelling description (see template below)
    - [ ] **Category**: Education or Productivity
    - [ ] **Language**: English (US)

3. **Privacy & Compliance:**
    - [ ] **Privacy Policy URL**: Create and host a privacy policy
    - [ ] **Single Purpose**: Extension has a single, clear purpose ✓
    - [ ] **User Data**: Document what data is collected (only local data)
    - [ ] **Permissions Justification**: Explain why each permission is needed

4. **Testing:**
    - [ ] Test on Chrome 88+ (Manifest V3 support)
    - [ ] Test on Edge (Chromium-based)
    - [ ] Verify all features work correctly
    - [ ] Test with different UW platform pages

### 📝 Store Listing Description Template

```
WatSearch Data Collector helps University of Waterloo students automatically collect and organize course information from multiple UW platforms into a single, searchable database.

KEY FEATURES:
• Automatic course outline extraction from outline.uwaterloo.ca
• Term-based filtering to process specific semesters
• Progress tracking and cancellation support
• Direct integration with local WatSearch application
• Support for LEARN, Quest, Piazza, and Course Outlines
• Zero external data transmission - all data stays local

HOW IT WORKS:
1. Install the extension and configure your local WatSearch URL
2. Navigate to outline.uwaterloo.ca and view your enrolled courses
3. Select which terms to process and click "Process Selected Course Outlines"
4. The extension automatically extracts course details and sends them to WatSearch
5. View and search all your course information in one place

PRIVACY & SECURITY:
• All data processing happens locally on your computer
• No data is sent to external servers
• Extension only accesses UW platforms you're already logged into
• You control when data is extracted and sent
• No login credentials are stored or accessed

REQUIREMENTS:
• Chrome 88+ or Edge 88+ (Chromium-based)
• Local WatSearch application running (see main README)
• Active login session to UW platforms

This extension is designed specifically for University of Waterloo students and respects UW's terms of service. It only extracts publicly available course information that you can already access through your authenticated sessions.
```

### 🔒 Privacy Policy Requirements

Create a privacy policy that covers:

1. **Data Collection**: What data is collected (course information, HTML content)
2. **Data Storage**: Where data is stored (local browser storage, local WatSearch instance)
3. **Data Transmission**: Where data is sent (only to localhost WatSearch instance)
4. **Third Parties**: No third-party services
5. **User Control**: Users control when data is extracted
6. **UW Compliance**: Respects University of Waterloo terms of service

### 🚀 Submission Steps

1. **Create Developer Account:**
    - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
    - Pay one-time $5 registration fee (if not already registered)

2. **Prepare ZIP File:**

    ```bash
    cd browser-extension
    zip -r watsearch-extension.zip . -x "*.git*" "*.md" "*.svg" "create_icons.html" "generate_icons.js"
    ```

3. **Upload Extension:**
    - Click "New Item" in developer dashboard
    - Upload the ZIP file
    - Fill in store listing details
    - Upload screenshots
    - Add privacy policy URL
    - Submit for review

4. **Review Process:**
    - Typically takes 1-3 business days
    - Google may request additional information
    - Respond promptly to any review comments

### 📱 Supported Browsers

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Other Chromium Browsers**: Should work with Manifest V3 support

## 📄 License

This extension is part of the WatSearch project and follows the same license terms.

---

**Note**: This extension is designed for University of Waterloo students and works with UW's specific platforms. The extension respects UW's terms of service and only extracts publicly available course information that you can access through your authenticated sessions.
