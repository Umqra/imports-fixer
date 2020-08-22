const fixImports = require("./fix-imports-codemod");
const pathResolver = require("./path-resolver");
const moduleRenamer = require("./module-renamer");
const gitRenamesProvider = require("./git-renames-provider");

pathResolver.addPlugin(pathResolver.plugins.fs());
moduleRenamer
  .addRename(
    "/home/sivukhin/edi/EDI/FrontClientApps/src/Commons/PageLeaveHandler/PageLeaveConfirmation.tsx",
    "/home/sivukhin/edi/EDI/FrontClientApps/src/lib/PageLeaveHandler/PageLeaveConfirmation.tsx"
  )
  .addSubjectRename("PageLeaveConfirmation", "LeaveConfirmation");

const sourceCode = `
import { PageLeaveConfirmation } from "../../Commons/PageLeaveHandler/PageLeaveConfirmation";
`;
const x = fixImports.renameImports(
  "/home/sivukhin/edi/EDI/FrontClientApps/src/ConnectionApplications/X5/X5ConnectionApplication.tsx",
  sourceCode,
  pathResolver,
  moduleRenamer
);
console.info("BEFORE", sourceCode);
console.info("AFTER", x);
gitRenamesProvider.getRenames("/home/sivukhin/code/imports-fixer").then((x) => console.info(x));
