const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get package.json content to get the app name and version
const packageJson = require('../package.json');
const appName = packageJson.build.productName;
const version = packageJson.version;

const platform = process.platform;

if (platform === 'darwin') {
  // For macOS, we'll mount the DMG and copy the app to Applications
  const arch = process.arch === 'arm64' ? '-arm64' : '';
  const dmgPath = path.join(__dirname, `../release/${appName}-${version}${arch}.dmg`);
  
  if (!fs.existsSync(dmgPath)) {
    console.error('DMG file not found:', dmgPath);
    process.exit(1);
  }

  console.log('Installing app...');
  
  // Mount the DMG
  exec(`hdiutil attach "${dmgPath}"`, (err) => {
    if (err) {
      console.error('Error mounting DMG:', err);
      process.exit(1);
    }

    // Copy app to Applications
    exec(`cp -r "/Volumes/${appName}/${appName}.app" /Applications`, (err) => {
      if (err) {
        console.error('Error copying app:', err);
      } else {
        console.log('App installed successfully to /Applications');
      }

      // Unmount the DMG
      exec(`hdiutil detach "/Volumes/${appName}"`, (err) => {
        if (err) {
          console.error('Error unmounting DMG:', err);
        }
      });
    });
  });
} else if (platform === 'win32') {
  // For Windows, we'll run the NSIS installer
  const installerPath = path.join(__dirname, `../release/${appName} Setup ${version}.exe`);
  
  if (!fs.existsSync(installerPath)) {
    console.error('Installer not found:', installerPath);
    process.exit(1);
  }

  console.log('Installing app...');
  exec(`"${installerPath}"`, (err) => {
    if (err) {
      console.error('Error running installer:', err);
      process.exit(1);
    }
    console.log('Installation started. Please follow the installation wizard.');
  });
} else if (platform === 'linux') {
  // For Linux, we'll install the AppImage
  const appImagePath = path.join(__dirname, `../release/${appName}-${version}.AppImage`);
  
  if (!fs.existsSync(appImagePath)) {
    console.error('AppImage not found:', appImagePath);
    process.exit(1);
  }

  // Make the AppImage executable and move it to /usr/local/bin
  console.log('Installing app...');
  exec(`chmod +x "${appImagePath}" && sudo mv "${appImagePath}" /usr/local/bin/${appName.toLowerCase()}`, (err) => {
    if (err) {
      console.error('Error installing AppImage:', err);
      process.exit(1);
    }
    console.log('App installed successfully to /usr/local/bin');
  });
} else {
  console.error('Unsupported platform:', platform);
  process.exit(1);
} 