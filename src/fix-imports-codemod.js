const recast = require("recast");
// todo (sivukhin, 22.08.2020): Fix!
const builder = recast.types.builders;

module.exports = {
  renameImports(filePath, sourceCode, pathResolver, moduleRenamer) {
    const ast = recast.parse(sourceCode, {
      parser: require("recast/parsers/babylon"),
    });
    recast.visit(ast, {
      visitImportDeclaration(path) {
        const { location, rewrite } = pathResolver.resolve(filePath, path.node.source.value);
        const renameImportConfig = moduleRenamer.findRename(location);
        if (renameImportConfig != null) {
          path.node.source.value = rewrite(renameImportConfig.newLocation);
          for (const specifier of path.node.specifiers) {
            if (specifier.type === "ImportSpecifier") {
              const importedItem = specifier.imported.name;
              specifier.imported.name = renameImportConfig.renameSubject(importedItem);
            }
          }
        }
        this.traverse(path);
      },
    });
    return recast.print(ast).code;
  },
};
