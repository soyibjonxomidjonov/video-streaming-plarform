const fs = require('fs');
const path = require('path');

const directory = 'd:\\D_Desktop\\video-streaming-platform\\frontend_v1\\frontendv2\\app\\(admin)';

const replacements = [
  { from: /#00e599/gi, to: '#00FFA3' },
  { from: /#101514/gi, to: '#0F171A' },
  { from: /#161f1c/gi, to: '#0B1013' },
  { from: /#8c9994/gi, to: '#64748B' },
  { from: /#f5f7f6/gi, to: '#F8FAFC' },
  { from: /#080a0a/gi, to: '#070A0C' },
  { from: /#1df2ad/gi, to: '#1AFFA8' },
  { from: /rgba\(0,229,153/gi, to: 'rgba(0,255,163' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { from, to } of replacements) {
        if (from.test(content)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
