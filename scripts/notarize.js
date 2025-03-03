require('dotenv').config();
const { notarize } = require('@electron/notarize');
const { build } = require('../package.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Log environment variables (masking sensitive data)
  console.log('Notarization environment check:');
  console.log('APPLE_ID:', process.env.APPLE_ID || 'Not set');
  console.log('APPLE_TEAM_ID:', process.env.APPLE_TEAM_ID || 'Not set');
  console.log('APPLE_APP_SPECIFIC_PASSWORD:', process.env.APPLE_APP_SPECIFIC_PASSWORD ? '✓ Set' : 'Not set');

  const appName = context.packager.appInfo.productFilename;
  const appBundleId = build.appId;

  console.log('Notarizing with details:');
  console.log('App Name:', appName);
  console.log('Bundle ID:', appBundleId);
  console.log('App Path:', `${appOutDir}/${appName}.app`);

  try {
    console.log('Starting notarization...');
    await notarize({
      tool: 'notarytool',
      appBundleId,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    });
    console.log('Notarization completed successfully!');
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
}; 