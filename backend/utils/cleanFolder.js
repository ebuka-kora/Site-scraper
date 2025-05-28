const fs = require("fs");
const path = require("path");

function cleanFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const fullPath = path.join(folderPath, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        cleanFolder(fullPath); // recursively delete contents of subfolders
        fs.rmdirSync(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    });
  }
}

module.exports = { cleanFolder };
