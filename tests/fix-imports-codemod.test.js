const fixer = require("../src/fix-imports-codemod");
const pathResolver = require("../src/path-resolver");
const moduleRenamer = require("../src/module-renamer");

describe("fix-imports-codemod", function () {
  beforeEach(() => {
    pathResolver.clear();
    moduleRenamer.clear();
  });
  test("should change paths for default exports", () => {
    pathResolver.addPlugin(
      pathResolver.plugins.typescript("/home/user/tsconfig.js", {
        baseUrl: ".",
        paths: { "root/*": ["src/lib/*"] },
      })
    );
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer.addRename("/home/user/src/lib/fn.js", "/home/user/src/lib/cast.js").addSubjectRename("f", "g");
    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `import f from "root/fn"`,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`import f from "root/cast"`);
  });
  test("should rename subject of imports", () => {
    pathResolver.addPlugin(
      pathResolver.plugins.typescript("/home/user/tsconfig.js", {
        baseUrl: ".",
        paths: { "root/*": ["src/lib/*"] },
      })
    );
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer.addRename("/home/user/src/lib/fn.js", "/home/user/src/lib/cast.js").addSubjectRename("f", "g");
    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `import { f } from "root/fn"`,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`import { g } from "root/cast"`);
  });
  test("should preserve spacing", () => {
    pathResolver.addPlugin(
      pathResolver.plugins.typescript("/home/user/tsconfig.js", {
        baseUrl: ".",
        paths: { "root/*": ["src/lib/*"] },
      })
    );
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer.addRename("/home/user/src/lib/fn.js", "/home/user/src/lib/cast.js").addSubjectRename("f", "g");
    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `import{f } from   "root/fn"`,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`import{g } from   "root/cast"`);
  });
  test("should preserve order with multiple imports", () => {
    pathResolver.addPlugin(
      pathResolver.plugins.typescript("/home/user/tsconfig.js", {
        baseUrl: ".",
        paths: { "root/*": ["src/lib/*"] },
      })
    );
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer
      .addRename("/home/user/src/lib/fn.js", "/home/user/src/lib/cast.js")
      .addSubjectRename("f", "g")
      .addSubjectRename("item", "element");
    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `import { test, f, query, item, element } from "root/fn"`,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`import { test, g, query, element, element } from "root/cast"`);
  });
  test("should silently ignore JSX syntax / Typescript annotations", () => {
    pathResolver.addPlugin(
      pathResolver.plugins.typescript("/home/user/tsconfig.js", {
        baseUrl: ".",
        paths: { "root/*": ["src/lib/*"] },
      })
    );
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer.addRename("/home/user/src/lib/fn.js", "/home/user/src/lib/cast.js");

    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `import { f } from "root/fn"
      interface ITest {
        value: string;
        output: number;
      }
      function App() {
        return   <div onClick=\{() => console.info(1)\}>Hello, world!
        \{/* comment */\}</div>;
      }`,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`import { f } from "root/cast"
      interface ITest {
        value: string;
        output: number;
      }
      function App() {
        return   <div onClick=\{() => console.info(1)\}>Hello, world!
        \{/* comment */\}</div>;
      }`);
  });
  test("should preserve import quotes style", () => {
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer.addRename("/home/user/src/lib/fn.js", "/home/user/src/lib/cast.js");
    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `import { f } from './fn'`,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`import { f } from './cast'`);
  });
  test("should handle alias imports", () => {
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer.addRename("/home/user/src/lib/fn.js", "/home/user/src/lib/cast.js").addSubjectRename("f", "g");
    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `import { f as test } from "./fn"`,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`import { g as test } from "./cast"`);
  });
  test("should rename import usages", () => {
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer.addRename("/home/user/src/lib/fn.js", "/home/user/src/lib/cast.js").addSubjectRename("f", "g");
    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `
        import { f } from "./fn"
        console.info(f());
        `,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`
        import { g } from "./cast"
        console.info(g());
        `);
  });
  test("should rename imported type usages", () => {
    pathResolver.addPlugin(pathResolver.plugins.fs());
    moduleRenamer
      .addRename("/home/user/src/lib/types.js", "/home/user/src/lib/typings.js")
      .addSubjectRename("IType", "IBase");
    const fixed = fixer.renameImports(
      "/home/user/src/lib/test.js",
      `
        import { IType } from "./types"
        interface Value extends IType {
            value: string;
        }
        function App(props: IType) {
            // todo
        }
        `,
      pathResolver,
      moduleRenamer
    );
    expect(fixed).toBe(`
        import { IBase } from "./typings"
        interface Value extends IBase {
            value: string;
        }
        function App(props: IBase) {
            // todo
        }
        `);
  });
});
