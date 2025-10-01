const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Simple media optimization script
async function optimizeMedia() {
  const publicDir = path.join(__dirname, 'public');

  console.log('Starting media optimization...');

  // Optimize videos if ffmpeg is available
  try {
    const backgroundVideo = path.join(publicDir, 'background.mp4');
    const wallpaperVideo = path.join(publicDir, 'wallpaper.mp4');

    if (fs.existsSync(backgroundVideo)) {
      console.log('Optimizing background.mp4...');
      // This would convert to WebM with lower bitrate
      // execPromise(`ffmpeg -i "${backgroundVideo}" -c:v libvpx-vp9 -b:v 1M -c:a libopus "${backgroundVideo}.webm"`);
    }

    if (fs.existsSync(wallpaperVideo)) {
      console.log('Optimizing wallpaper.mp4...');
      // execPromise(`ffmpeg -i "${wallpaperVideo}" -c:v libvpx-vp9 -b:v 2M -c:a libopus "${wallpaperVideo}.webm"`);
    }
  } catch (error) {
    console.log('FFmpeg not available for video optimization');
  }

  // Optimize GIF files to WebP if cwebp is available
  const gifFiles = [
    'image/02862783750FA845A57A2457C7F93D4E.gif',
    'image/Artwork_Middle.gif',
    'image/Artwork_Middle-ezgif.com-resize.gif',
    'image/Artwork_Right_Top.gif'
  ];

  gifFiles.forEach(gifFile => {
    const gifPath = path.join(publicDir, gifFile);
    if (fs.existsSync(gifPath)) {
      console.log(`Optimizing ${gifFile}...`);
      // execPromise(`cwebp -q 80 "${gifPath}" -o "${gifPath}.webp"`);
    }
  });

  console.log('Media optimization script completed');
}

// Run optimization if called directly
if (require.main === module) {
  optimizeMedia().catch(console.error);
}

module.exports = { optimizeMedia };