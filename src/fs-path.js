const path = require("path");

module.exports = {
  stripExtension(filePath) {
    const ext = path.extname(filePath);
    return filePath.substr(0, filePath.length - ext.length);
  },
  makeRelative(path) {
    if (path.startsWith(".")) {
      return path;
    }
    return "./" + path;
  },
  simpleJoin(...paths) {
    let result = paths[0];
    for (let i = 1; i < paths.length; i++) {
      if (!result.endsWith(path.sep)) {
        result += path.sep;
      }
      result += paths[i];
    }
    if (result.endsWith(path.sep)) {
      result = result.substr(0, result.length - 1);
    }
    return result;
  },
  slash(path) {
    return path.replace(/\\/g, "/");
  },
};
