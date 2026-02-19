const fs = require('fs');

const pagePath = '/opt/adminflow/client/app/notifications/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Add import for PushNotificationSettings if not already present
if (!content.includes('PushNotificationSettings')) {
  // Find the last import line and add after it
  const importRegex = /^import .+ from .+;?\s*$/gm;
  let lastImportMatch;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    lastImportMatch = match;
  }
  
  if (lastImportMatch) {
    const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
    const importStatement = '\nimport { PushNotificationSettings } from "@/components/notifications/push-notification-settings";';
    content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
  }
}

// Find the "Info Card" section and add PushNotificationSettings before it
if (!content.includes('<PushNotificationSettings')) {
  const infoCardMarker = '{/* Info Card */}';
  const insertIndex = content.indexOf(infoCardMarker);
  
  if (insertIndex !== -1) {
    const pushSection = `{/* Push Notifications */}
      <PushNotificationSettings />

      `;
    content = content.slice(0, insertIndex) + pushSection + content.slice(insertIndex);
    console.log('Added PushNotificationSettings component');
  } else {
    console.log('Could not find Info Card marker');
  }
}

fs.writeFileSync(pagePath, content);
console.log('Updated notifications page');
