const git = require("simple-git");
const path = require("path");
module.exports = {
  getRenames(gitDir) {
    const configuredGit = git({ baseDir: gitDir });
    return configuredGit
      .status()
      .then((status) => status.renamed.map((r) => ({ from: path.join(gitDir, r.from), to: path.join(gitDir, r.to) })));
  },
};
