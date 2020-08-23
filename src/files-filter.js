const fs = require("fs");
const path = require("path");

function getFiles(root) {
  const dirItems = fs.readdirSync(root);
  const files = [];
  for (const item of dirItems) {
    const itemPath = path.join(root, item);
    if (fs.statSync(itemPath).isDirectory()) {
      files.push(...getFiles(itemPath));
    } else {
      files.push(itemPath);
    }
  }
  return files;
}

module.exports = {
  readDir(root) {
    return getFiles(root);
  },
};
