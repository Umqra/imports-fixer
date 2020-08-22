const git = require("isomorphic-git");
const fs = require("fs");
module.exports = {
  async getRenames(gitDir) {
    const status = await git.statusMatrix({ fs, dir: gitDir });
    console.info(status);
  },
};
