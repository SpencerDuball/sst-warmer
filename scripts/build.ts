import { rmSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import ts from "typescript";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import esbuild from "esbuild";

// define constants
const OutDir = path.resolve(__dirname, "..", "dist");
const TSConfigFile = path.resolve(__dirname, "..", "src", "tsconfig.json");
const CjsModuleKind = ts.ModuleKind.CommonJS;
const EsmModuleKind = ts.ModuleKind.ES2020;

/**
 * Compiles and write the compiled TypeScript code to JavaScript and declaration files.
 *
 * @param cfg The tsc config.
 */
async function compile(cfg: ts.ParsedCommandLine) {
  // create the compiler host
  const host = ts.createCompilerHost(cfg.options);
  host.writeFile = (fileName, contents) => {
    const isDts = fileName.endsWith(".d.ts");

    if (!isDts) {
      const module = cfg.options.module;
      if (module === CjsModuleKind) fileName = fileName.replace(/\.js$/, ".cjs");
      else if (module === EsmModuleKind) fileName = fileName.replace(/\.js$/, ".mjs");
    }

    mkdir(path.dirname(fileName), { recursive: true })
      .finally(async () => writeFile(fileName, contents))
      .then(() => console.log("Built", fileName))
      .catch((error) => console.log(error));
  };

  // create the program
  const program = ts.createProgram(cfg.fileNames, cfg.options, host);

  // compile the files
  program.emit();
}

/**
 * Build the code.
 */
async function main() {
  // delete and recreate output directory
  try {
    rmSync(OutDir, { recursive: true });
  } catch (error) {
    if ((error as any).code !== "ENOENT") throw error;
  }

  // read the tsconifg.json file
  const cfgFile = ts.readConfigFile(TSConfigFile, ts.sys.readFile);
  const cfg = ts.parseJsonConfigFileContent(cfgFile.config, ts.sys, path.join(__dirname, "..", "src"));

  // compile
  compile({ ...cfg, options: { ...cfg.options, module: CjsModuleKind } });
  compile({ ...cfg, options: { ...cfg.options, module: EsmModuleKind } });

  // esbuild support files
  await Promise.all(
    ["warmer-function"].map((dir) =>
      esbuild.build({
        keepNames: true,
        bundle: true,
        platform: "node",
        target: "esnext",
        format: "esm",
        entryPoints: [`./support/${dir}/index.ts`],
        banner: {
          js: [
            `import { createRequire as topLevelCreateRequire } from "module";`,
            `const require = topLevelCreateRequire(import.meta.url);`,
          ].join(""),
        },
        outExtension: { ".js": ".mjs" },
        outdir: `./dist/support/${dir}/`,
      })
    )
  );
}

main();
