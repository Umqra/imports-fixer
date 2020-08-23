#!/usr/bin/env node
const { program } = require("commander");
const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const diff = require("diff");

const importsFixer = require("../src");
const fsPath = require("../src/fs-path");

program
  .option("--dry", "dry run - outputs changed files and does not commit changes to the disk")
  .option("--tsconfig <path>", "path to the tsconfig.json configuration file")
  .option("--include-content <content-regex>", "include files which content matches specified regexp")
  .option("--exclude-content <content-regex>", "exclude files which content matches specified regexp")
  .requiredOption("--git-dir <path>", "path to the git directory with the renames to track")
  .requiredOption("--source-dir <path>", "path to the directory with sources to fix")
  .requiredOption(
    "--include-extensions <comma-separated-extensions>",
    "list of file extensions to fix",
    "js, ts, jsx, tsx"
  )
  .requiredOption("--config <path>", "path to the imports-fixer configuration script");
program.parse(process.argv);

function getPath(p) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

const configScript = require(getPath(program.config));

const pathResolverPlugins =
  program.tsconfig != null
    ? [importsFixer.pathResolverPlugins.typescript(getPath(program.tsconfig)), importsFixer.pathResolverPlugins.fs]
    : [importsFixer.pathResolverPlugins.fs];

let fixedFiles = [];
importsFixer
  .run(
    pathResolverPlugins,
    importsFixer.renameSources.git(getPath(program.gitDir)),
    (from, to, registry) => {
      configScript.registerRename(
        {
          path: from,
          name: fsPath.stripExtension(path.basename(from)),
          ext: path.extname(from),
        },
        {
          path: to,
          name: fsPath.stripExtension(path.basename(to)),
          ext: path.extname(to),
        },
        registry
      );
    },
    importsFixer.files(
      getPath(program.sourceDir),
      (p) => {
        for (const ext of program.includeExtensions.split(",").map((x) => x.trim())) {
          if (new RegExp(`.${ext}$`).test(p)) {
            return true;
          }
        }
        return false;
      },
      (c) => {
        if (program.includeContent == null && program.excludeContent == null) {
          return true;
        }
        if (program.includeContent != null && program.excludeContent == null) {
          return new RegExp(program.includeContent).test(c);
        }
        if (program.excludeContent != null && program.includeContent == null) {
          return !new RegExp(program.excludeContent).test(c);
        }
        return new RegExp(program.includeContent).test(c) && !new RegExp(program.excludeContent).test(c);
      }
    ),
    (path, before, after) => {
      if (program.dry) {
        process.stderr.write(chalk.bold.white(path + ":\n"));
        for (const delta of diff.diffLines(before, after)) {
          if (delta.added) {
            process.stderr.write(chalk.green("+ " + delta.value));
          }
          if (delta.removed) {
            process.stderr.write(chalk.red("- " + delta.value));
          }
        }
        process.stderr.write("\n");
      } else if (before !== after) {
        fixedFiles.push(path);
        fs.writeFileSync(path, after);
      }
    }
  )
  .then(() => {
    if (!program.dry) {
      process.stderr.write(
        chalk.bold.white(`Fixed ${fixedFiles.length} ${fixedFiles.length === 1 ? "file" : "files"}:\n`)
      );
      for (const file of fixedFiles) {
        process.stderr.write(chalk.bold.gray(`  ${file}\n`));
      }
    }
  })
  .catch((err) => process.stderr.write(chalk.bold.red(err.stack + "\n")));
