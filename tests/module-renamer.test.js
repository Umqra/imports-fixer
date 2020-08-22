const moduleRenamer = require("../src/module-renamer");
describe("module-renamer", () => {
  beforeEach(() => {
    moduleRenamer.clear();
  });
  test("should do simple rename", () => {
    moduleRenamer.addRename("/home/user/src/lib.js", "/home/user/src/func.js");
    const rename = moduleRenamer.findRename("/home/user/src/lib");
    expect(rename.newLocation).toBe("/home/user/src/func");
    expect(rename.renameSubject("item")).toBe("item");
  });
  test("should return null for unknown rename", () => {
    const rename = moduleRenamer.findRename("/home/user/src/lib");
    expect(rename).toBeNull();
  });
  test("should rename subjects", () => {
    moduleRenamer
      .addRename("/home/user/src/lib.js", "/home/user/src/func.js")
      .addSubjectRename("item", "element")
      .addSubjectRename("element", "item");
    const rename = moduleRenamer.findRename("/home/user/src/lib");
    expect(rename.newLocation).toBe("/home/user/src/func");
    expect(rename.renameSubject("item")).toBe("element");
    expect(rename.renameSubject("element")).toBe("item");
    expect(rename.renameSubject("subject")).toBe("subject");
  });
});
