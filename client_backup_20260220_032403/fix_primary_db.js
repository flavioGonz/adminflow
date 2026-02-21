const fs = require('fs');

const sidebarPath = '/opt/adminflow/client/components/layout/sidebar.tsx';
let content = fs.readFileSync(sidebarPath, 'utf8');

// Fix the primary database detection - the API returns {status: [...]} with role: "primary" not isPrimary
const oldCode = `const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const primary = list.find((s: any) => s.isPrimary);`;

const newCode = `const data = await res.json();
        // Handle both {status: [...]} wrapper and direct array
        const list = Array.isArray(data) ? data : (Array.isArray(data?.status) ? data.status : []);
        // Check for role === "primary" OR isPrimary === true
        const primary = list.find((s: any) => s.role === "primary" || s.isPrimary);`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  console.log('Fixed primary DB detection (LF)');
} else {
  const oldCodeCRLF = oldCode.replace(/\n/g, '\r\n');
  const newCodeCRLF = newCode.replace(/\n/g, '\r\n');
  if (content.includes(oldCodeCRLF)) {
    content = content.replace(oldCodeCRLF, newCodeCRLF);
    console.log('Fixed primary DB detection (CRLF)');
  } else {
    console.log('Could not find pattern to fix');
  }
}

fs.writeFileSync(sidebarPath, content);
console.log('Done');
