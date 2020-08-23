const importsFixer = require("./index");
const path = require("path");
const fsPath = require("./fs-path");

importsFixer.run(
  [importsFixer.pathResolverPlugins.fs],
  importsFixer.renameSources.git("/home/sivukhin/code/imports-fixer-test/src"),
  (from, to, registry) => {
    const rename = registry.addRename(from, to);
    const fromName = fsPath.stripExtension(path.basename(from));
    const toName = fsPath.stripExtension(path.basename(to));
    if (fromName !== toName) {
      rename.addSubjectRename(fromName, toName);
    }
  },
  importsFixer.files("/home/sivukhin/code/imports-fixer-test/src", (p) => /\.js$/.test(p))
);
