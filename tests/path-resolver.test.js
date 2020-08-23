const pathResolver = require("../src/path-resolver");
describe("path-resolver", () => {
  beforeEach(() => {
    pathResolver.clear();
  });
  test("should combine plugins", () => {
    pathResolver.addPlugin(
      pathResolver.plugins.typescript("/home/src/tsconfig.js", { compilerOptions: { baseUrl: "." } })
    );
    pathResolver.addPlugin(pathResolver.plugins.fs());
    const resolvedRelative = pathResolver.resolve("/home/src/lib/test.js", "../api/fetch");
    expect(resolvedRelative.location).toBe("/home/src/api/fetch");
    expect(resolvedRelative.rewrite("/home/src/ext/fetch.js")).toBe("../ext/fetch");

    const resolvedBase = pathResolver.resolve("/home/src/lib/test.js", "api/fetch");
    expect(resolvedBase.location).toBe("/home/src/api/fetch");
    expect(resolvedBase.rewrite("/home/src/ext/fetch.js")).toBe("ext/fetch");
  });
  test("should throw error when unable to resolve path", () => {
    expect(() => pathResolver.resolve("/home/src/lib/test.js", "../api/fetch")).toThrow();
  });
  describe("fs", () => {
    const fs = pathResolver.plugins.fs();
    test("should resolve relative external paths", () => {
      const resolved = fs("/home/src/lib/test.js", "../api/fetch");
      expect(resolved.location).toBe("/home/src/api/fetch");
      expect(resolved.rewrite("/home/src/ext/fetch.js")).toBe("../ext/fetch");
    });
    test("should resolve relative subdirectory paths", () => {
      const resolved = fs("/home/src/lib/test.js", "./utils/fs");
      expect(resolved.location).toBe("/home/src/lib/utils/fs");
      expect(resolved.rewrite("/home/src/lib/helpers/filesystem.js")).toBe("./helpers/filesystem");
    });
    test("should resolve relative path in the same directory", () => {
      const resolved = fs("/home/src/lib/test.js", "./fs");
      expect(resolved.location).toBe("/home/src/lib/fs");
      expect(resolved.rewrite("/home/src/lib/filesystem.js")).toBe("./filesystem");
      expect(resolved.rewrite("/home/src/lib/utils/fs.js")).toBe("./utils/fs");
      expect(resolved.rewrite("/home/src/ext/fs.js")).toBe("../ext/fs");
    });
    test("should resolve absolute paths", () => {
      const resolved = fs("/home/src/lib/test.js", "/home/src/api/fetch");
      expect(resolved.location).toBe("/home/src/api/fetch");
      expect(resolved.rewrite("/home/src/ext/fetch.js")).toBe("/home/src/ext/fetch");
    });
  });
  describe("typescript", () => {
    test("should recognize baseUrl", () => {
      const ts = pathResolver.plugins.typescript("/home/src/tsconfig.js", { compilerOptions: { baseUrl: "." } });
      const resolved = ts("/home/src/lib/test.js", "api/fetch");
      expect(resolved.location).toBe("/home/src/api/fetch");
      expect(resolved.rewrite("/home/src/ext/fetch.js")).toBe("ext/fetch");
    });
    test("should not recognize relative paths", () => {
      const ts = pathResolver.plugins.typescript("/home/src/tsconfig.js", { compilerOptions: { baseUrl: "." } });
      const resolved = ts("/home/src/lib/test.js", "../api/fetch");
      expect(resolved).toBeNull();
    });
    test("should ignore multiple path aliases", () => {
      const ts = pathResolver.plugins.typescript("/home/src/tsconfig.js", {
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "root/*": ["src/lib/*", "src/api/*"],
          },
        },
      });
      const resolved = ts("/home/src/lib/test.js", "root/fetch");
      expect(resolved.location).toBe("/home/src/root/fetch");
    });
    test("should recognize path aliases", () => {
      const ts = pathResolver.plugins.typescript("/home/tsconfig.js", {
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "root/*": ["src/api/*"],
          },
        },
      });
      const resolved = ts("/home/src/lib/test.js", "root/fetch");
      expect(resolved.location).toBe("/home/src/api/fetch");
      expect(resolved.rewrite("/home/src/api/fetch2.js")).toBe("root/fetch2");
      expect(resolved.rewrite("/home/src/ext/fetch.js")).toBe("root/../ext/fetch");
    });
  });
});
