const recast = require("recast");

const parser = require("@babel/parser");

function getOption(options, key, defaultValue) {
  if (options && options.hasOwnProperty(key)) {
    return options[key];
  }
  return defaultValue;
}

function getBabelOptions(options) {
  return {
    sourceType: getOption(options, "sourceType", "module"),
    strictMode: getOption(options, "strictMode", false),
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    startLine: 1,
    tokens: true,
    plugins: [
      "asyncGenerators",
      "bigInt",
      "classPrivateMethods",
      "classPrivateProperties",
      "classProperties",
      "decorators-legacy",
      "doExpressions",
      "dynamicImport",
      "exportDefaultFrom",
      "exportExtensions",
      "exportNamespaceFrom",
      "functionBind",
      "functionSent",
      "importMeta",
      "nullishCoalescingOperator",
      "numericSeparator",
      "objectRestSpread",
      "optionalCatchBinding",
      "optionalChaining",
      ["pipelineOperator", { proposal: "minimal" }],
      "throwExpressions",
      "jsx",
      "typescript",
    ],
  };
}

function parse(source, options) {
  return parser.parse(source, getBabelOptions(options));
}

module.exports = {
  renameImports(filePath, sourceCode, pathResolver, moduleRenamer) {
    const ast = recast.parse(sourceCode, {
      parser: {
        parse: parse,
      },
    });
    const renamedIdentifiers = new Map();
    recast.visit(ast, {
      visitIdentifier(path) {
        if (renamedIdentifiers.has(path.node.name)) {
          path.node.name = renamedIdentifiers.get(path.node.name);
        }
        this.traverse(path);
      },
      visitImportDeclaration(path) {
        const { location, rewrite } = pathResolver.resolve(filePath, path.node.source.value);
        const renameImportConfig = moduleRenamer.findRename(location);
        if (renameImportConfig != null) {
          path.node.source.value = rewrite(renameImportConfig.newLocation);
          for (const specifier of path.node.specifiers) {
            if (specifier.type === "ImportSpecifier") {
              const importedItem = specifier.imported.name;
              const localItem = specifier.local.name;
              specifier.imported.name = renameImportConfig.renameSubject(importedItem);
              if (localItem === importedItem) {
                renamedIdentifiers.set(importedItem, specifier.imported.name);
              }
            }
          }
        }
        return false;
      },
    });
    return recast.print(ast).code;
  },
};
