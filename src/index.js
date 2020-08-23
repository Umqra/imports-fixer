const fs = require("fs");
const path = require("path");
const filesFilter = require("./files-filter");
const fixImports = require("./fix-imports-codemod");
const pathResolver = require("./path-resolver");
const moduleRenamer = require("./module-renamer");
const gitRenamesProvider = require("./git-renames-provider");

module.exports = {
  async run(pathResolverPlugins, renameSource, renameRegistryCallback, filesToFixCollection, fixAction) {
    for (const plugin of pathResolverPlugins) {
      pathResolver.addPlugin(plugin);
    }
    const renames = await renameSource;
    for (const { from, to } of renames) {
      renameRegistryCallback(from, to, moduleRenamer);
    }
    for (const filePath of filesToFixCollection) {
      const sourceCode = fs.readFileSync(filePath, "utf-8");
      const fixedSourceCode = fixImports.renameImports(filePath, sourceCode, pathResolver, moduleRenamer);
      fixAction(filePath, sourceCode, fixedSourceCode);
    }
  },
  pathResolverPlugins: {
    fs: pathResolver.plugins.fs(),
    typescript: (tsconfigPath) => {
      return pathResolver.plugins.typescript(tsconfigPath, JSON.parse(fs.readFileSync(tsconfigPath, "utf-8")));
    },
  },
  renameSources: {
    git: gitRenamesProvider.getRenames,
  },
  files: (root, matchPath, matchContent) => {
    const files = filesFilter.readDir(root);
    const filteredFiles = [];
    for (const file of files) {
      if (matchPath && !matchPath(file)) {
        continue;
      }
      if (matchContent) {
        const content = fs.readFileSync(file, "utf-8");
        if (!matchContent(content)) {
          continue;
        }
      }
      filteredFiles.push(file);
    }
    return filteredFiles;
  },
};
