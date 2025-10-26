# WatSearch Browser Extension

A Chrome/Edge extension that automatically extracts course data from University of Waterloo platforms (LEARN, Quest, Piazza) and sends it to your local WatSearch application.

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

### Automatic Data Collection

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

### Manual Data Collection

1. **Open Extension Popup:**

   - Click the WatSearch extension icon
   - The popup shows which site you're currently on

2. **Extract Data Manually:**

   - Click "Extract Course Data" button
   - Wait for the extraction to complete
   - You'll see how many items were found

3. **Send to WatSearch:**
   - Click "Send to WatSearch" to sync the data
   - The data will appear in your WatSearch application

## 📊 What Data is Collected

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

## 📄 License

This extension is part of the WatSearch project and follows the same license terms.

---

**Note**: This extension is designed for University of Waterloo students and works with UW's specific platforms. The extension respects UW's terms of service and only extracts publicly available course information.
