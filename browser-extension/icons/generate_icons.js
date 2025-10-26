// Simple script to generate placeholder icons for the extension
// Run this in a browser console to create the icons

function createIcon(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Background circle
  ctx.fillStyle = "#d32f2f";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
  ctx.fill();

  // White border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // W text
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("W", size / 2, size / 2);

  return canvas.toDataURL("image/png");
}

// Generate icons
const icon16 = createIcon(16);
const icon48 = createIcon(48);
const icon128 = createIcon(128);

console.log("16x16 icon data URL:", icon16);
console.log("48x48 icon data URL:", icon48);
console.log("128x128 icon data URL:", icon128);

// Instructions
console.log("To create the PNG files:");
console.log("1. Copy each data URL above");
console.log("2. Open in a new browser tab");
console.log('3. Right-click and "Save image as"');
console.log("4. Save as icon16.png, icon48.png, icon128.png");
