const recast = require("recast");
// todo (sivukhin, 22.08.2020): Fix!
const builder = recast.types.builders;

module.exports = {
  renameImports(filePath, sourceCode, pathResolver, moduleRenamer) {
    const ast = recast.parse(sourceCode, {
      parser: require("recast/parsers/babylon"),
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
