# Icon Setup for WatSearch Extension

## Quick Setup (2 minutes)

### Option 1: Use Online Icon Generator

1. Go to https://favicon.io/favicon-generator/
2. Enter "W" as the text
3. Choose red color (#d32f2f)
4. Download the generated icons
5. Rename and place in the `icons/` folder:
    - `favicon-16x16.png` → `icon16.png`
    - `favicon-32x32.png` → `icon48.png` (resize to 48x48)
    - `favicon-192x192.png` → `icon128.png` (resize to 128x128)

### Option 2: Use the HTML Generator

1. Open `icons/create_icons.html` in your browser
2. Right-click each icon and "Save image as"
3. Save as `icon16.png`, `icon48.png`, `icon128.png`

### Option 3: Use the JavaScript Generator

1. Open browser console (F12)
2. Copy and paste the code from `icons/generate_icons.js`
3. Follow the instructions to save the generated icons

## Icon Requirements

- **icon16.png**: 16x16 pixels (for toolbar)
- **icon48.png**: 48x48 pixels (for extension management)
- **icon128.png**: 128x128 pixels (for Chrome Web Store)

## Design

- **Background**: Red circle (#d32f2f)
- **Text**: White "W" for WatSearch
- **Style**: Simple, clean, recognizable

## Testing

After creating the icons:

1. Load the extension in Chrome
2. Check that the icon appears in the toolbar
3. Verify the icon shows in chrome://extensions/

## Troubleshooting

If icons don't appear:

- Check file names match exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Ensure files are in the `icons/` folder
- Try reloading the extension
- Check file permissions

---

**Note**: These are placeholder icons. For production, consider creating professional icons with a graphic designer or using tools like Figma, Canva, or Adobe Illustrator.
