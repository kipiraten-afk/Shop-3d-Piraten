const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const zip = new AdmZip();

function addFolderToZip(folderPath, zipPath) {
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    if (file === 'node_modules' || file === 'dist' || file === '.git') {
      continue;
    }
    if (folderPath === '.' && file === 'public') {
      // Just add the contents of public manually, except source.zip
      const publicFiles = fs.readdirSync('public');
      for (const pFile of publicFiles) {
        if (!pFile.includes('source.zip')) {
          const pFullPath = path.join('public', pFile);
          if (fs.statSync(pFullPath).isDirectory()) {
             zip.addLocalFolder(pFullPath, path.join('public', pFile));
          } else {
             zip.addLocalFile(pFullPath, 'public');
          }
        }
      }
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addFolderToZip(fullPath, path.join(zipPath, file));
    } else {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

// Add everything except excluded folders
addFolderToZip('.', '');

// Create public if not exists
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Write to public/source.zip
zip.writeZip('public/source.zip');
console.log('Successfully created public/source.zip');
