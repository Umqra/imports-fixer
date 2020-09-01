## [<img src="https://img.shields.io/npm/v/imports-fixer">](https://www.npmjs.com/package/imports-fixer) imports-fixer

Simple codemod to fix your imports

Use this tools via NPX or simply install it as dev dependency in the project:

```bash
$> npm install --save-dev imports-fixer
$> npx imports-fixer --help
Usage: cli [options]

Options:
  --dry                                              dry run - outputs changed files and does not commit changes to the disk
  --tsconfig <path>                                  path to the tsconfig.json configuration file
  --include-content <content-regex>                  include files which content matches specified regexp
  --exclude-content <content-regex>                  exclude files which content matches specified regexp
  -d, --debug                                        enable debug log
  --git-dir <path>                                   path to the git directory with the renames to track
  --source-dir <path>                                path to the directory with sources to fix
  --include-extensions <comma-separated-extensions>  list of file extensions to fix (default: "js, ts, jsx, tsx")
  --config <path>                                    path to the imports-fixer configuration script
  -h, --help                                         display help for command
```

To enable `imports-fixer` codemod you need to write simple Javascript config file, that will tell codemod the rules about imports renaming.
Simple configuration may look like this:

```js
// .rename-config.js

const path = require("path");
const backendDomain = "/home/user/project/backend";
const frontendDomain = "/home/user/project/frontend/models";

function transformPath(p) {
  if (p.startsWith(backendDomain)) {
    return path.join(frontendDomain, path.relative(backendDomain, p));
  }
  return undefined;
}

module.exports = {
  registerRename({ path: fromPath, name: from }, { path: toPath, name: to }, registry) {
    const fromTransformed = transformPath(fromPath);
    const toTransformed = transformPath(toPath);
    if (fromTransformed != null && toTransformed != null) {
      const rename = registry.addRename(fromTransformed, toTransformed);
      if (from !== to) {
        rename.addSubjectRename(from, to);
      }
    }
  },
};
```

And then you can fix imports in your git repository with simple command:

```bash
$> npx imports-fixer --config .rename-config.js --git-dir /home/user/project --source-dir /home/user/project/frontend
```
