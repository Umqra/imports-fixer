const fs = require("./fs-path");

const renames = {};

module.exports = {
  clear() {
    for (const key in renames) {
      delete renames[key];
    }
  },
  findRename(oldPath) {
    if (renames.hasOwnProperty(oldPath)) {
      return renames[oldPath];
    }
    return null;
  },
  addRename(oldPath, newPath) {
    const oldPathStripped = fs.stripExtension(oldPath);
    const newPathStripped = fs.stripExtension(newPath);
    const changedSubjects = {};
    return (renames[oldPathStripped] = {
      newLocation: newPathStripped,
      renameSubject: function (subject) {
        if (changedSubjects.hasOwnProperty(subject)) {
          return changedSubjects[subject];
        }
        return subject;
      },
      addSubjectRename(oldSubject, newSubject) {
        changedSubjects[oldSubject] = newSubject;
        return this;
      },
    });
  },
};
