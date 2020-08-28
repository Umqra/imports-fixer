const path = require("path");
const fs = require("./fs-path");

const enabledPlugins = [];
module.exports = {
  clear() {
    enabledPlugins.splice(0);
  },
  addPlugin(plugin) {
    enabledPlugins.push(plugin);
  },
  resolve(filePath, importPath) {
    for (const plugin of enabledPlugins) {
      const pluginResolution = plugin(filePath, importPath);
      if (pluginResolution != null) {
        return pluginResolution;
      }
    }
    throw new Error(`path-resolver:no plugin can't resolve import ${importPath} in the file ${filePath}`);
  },
  plugins: {
    fs: function () {
      return function (filePath, importPath) {
        const fileDir = path.dirname(filePath);
        const isAbsolute = path.isAbsolute(importPath);
        return {
          location: isAbsolute ? importPath : path.join(fileDir, importPath),
          rewrite(newImportPath) {
            const newImportPathStripped = fs.stripExtension(newImportPath);
            return isAbsolute
              ? newImportPathStripped
              : fs.makeRelative(path.relative(fileDir, fs.stripExtension(newImportPathStripped)));
          },
        };
      };
    },
    typescript: function (tsconfigPath, tsconfig) {
      const compilerOptions = tsconfig.compilerOptions;
      const baseUrl = path.join(path.dirname(tsconfigPath), compilerOptions.baseUrl);
      const paths = compilerOptions.paths;
      return function (filePath, importPath) {
        if (importPath.startsWith(".")) {
          return null;
        }
        importPath = path.normalize(importPath);
        const aliases = paths == null ? [] : Object.entries(paths);
        let resolvedAliasImport = null;
        let usedAlias = null;
        for (const [aliasPathPattern, mappedPaths] of aliases) {
          if (!aliasPathPattern.endsWith("*")) {
            continue;
          }
          if (paths[aliasPathPattern].length !== 1) {
            continue;
          }
          const aliasPath = path.normalize(aliasPathPattern.substr(0, aliasPathPattern.length - 1));
          const mappedPaths = paths[aliasPathPattern]
            .filter((x) => x.endsWith("*"))
            .map((x) => x.substr(0, x.length - 1));
          if (mappedPaths.length === 0) {
            continue;
          }
          if (importPath.startsWith(aliasPath)) {
            resolvedAliasImport = path.join(baseUrl, mappedPaths[0], importPath.substr(aliasPath.length));
            usedAlias = [aliasPath, mappedPaths[0]];
            break;
          }
        }
        return {
          location: resolvedAliasImport == null ? path.join(baseUrl, importPath) : resolvedAliasImport,
          rewrite(newImportPath) {
            const newImportPathStripped = fs.stripExtension(newImportPath);
            if (resolvedAliasImport == null) {
              return path.relative(baseUrl, newImportPathStripped);
            }
            return fs.simpleJoin(usedAlias[0], path.relative(path.join(baseUrl, usedAlias[1]), newImportPathStripped));
          },
        };
      };
    },
  },
};
