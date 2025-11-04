# WatSearch Browser Extension Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install the Extension

1. **Open Chrome/Edge Extensions:**
    - Go to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
    - Enable "Developer mode" (toggle in top right corner)

2. **Load the Extension:**
    - Click "Load unpacked"
    - Navigate to your WatSearch project folder
    - Select the `browser-extension` folder
    - Click "Select Folder"

3. **Pin the Extension:**
    - Click the puzzle piece icon in your browser toolbar
    - Find "WatSearch Data Collector"
    - Click the pin icon to keep it visible

### Step 2: Start WatSearch

1. **Start the Application:**

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

## 🔧 Troubleshooting

### Extension Not Appearing

- **Check Developer Mode:** Make sure "Developer mode" is enabled in `chrome://extensions/`
- **Reload Extension:** Click the refresh icon on the extension card
- **Check Console:** Open browser console (F12) for error messages

### "No Active Tab" Error

- **Refresh the Page:** Try refreshing the UW site you're on
- **Check Site Support:** Make sure you're on LEARN, Quest, or Piazza
- **Wait for Page Load:** Let the page fully load before using the extension

### Connection Test Failed

- **Check WatSearch is Running:** Make sure `npm run dev` is running
- **Check Port:** Verify the correct port in the extension settings
- **Check Firewall:** Ensure your firewall allows local connections

### Data Not Appearing in WatSearch

- **Check API Endpoint:** Visit `http://localhost:3000/api/health` in your browser
- **Check Console:** Look for errors in the WatSearch terminal
- **Try Different Port:** Update the WatSearch URL in extension settings

### Extension Popup Not Working

- **Reload Extension:** Go to `chrome://extensions/` and reload the extension
- **Check Permissions:** Ensure the extension has necessary permissions
- **Restart Browser:** Try closing and reopening your browser

## 📊 What Data is Collected

### From LEARN:

- Course information (name, code, term)
- Assignments and due dates
- Announcements
- Course materials

### From Quest:

- Course schedule
- Course information
- Instructor details
- Term information

### From Piazza:

- Discussion posts
- Q&A threads
- Course discussions

## 🔒 Privacy & Security

- **Local Only:** All data stays on your computer
- **No External Servers:** Data is only sent to your local WatSearch application
- **No Credentials:** The extension doesn't store or access your login information
- **User Control:** You decide when to extract and send data

## 🆘 Need Help?

1. **Check the Logs:**
    - Open browser console (F12) for extension errors
    - Check WatSearch terminal for API errors

2. **Test Components:**
    - Test WatSearch API: `http://localhost:3000/api/health`
    - Test extension popup functionality
    - Test data extraction on different UW sites

3. **Common Issues:**
    - Port conflicts (try 3001, 3002)
    - Site layout changes (UW sites update frequently)
    - Login requirements (make sure you're logged in)

## 🎉 Success!

Once everything is working:

- Navigate to any UW site (LEARN, Quest, Piazza)
- The extension will automatically extract data
- Click "Send to WatSearch" to sync
- Check your WatSearch application to see the imported data
- Use WatSearch to search, browse, and manage your course information!

---

**Note:** This extension is designed for University of Waterloo students and works with UW's specific platforms. The extension respects UW's terms of service and only extracts publicly available course information.
