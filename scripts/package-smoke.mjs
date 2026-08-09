import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const temporaryRoot = await mkdtemp(join(tmpdir(), "speech-provider-package-"));

try {
  execFileSync("bun", ["run", "build"], {
    cwd: projectRoot,
    stdio: "inherit",
  });
  const packResult = JSON.parse(
    execFileSync(
      "npm",
      ["pack", "--json", "--pack-destination", temporaryRoot],
      {
        cwd: projectRoot,
        encoding: "utf8",
      },
    ),
  );
  const tarballPath = join(temporaryRoot, packResult[0].filename);
  const consumerDirectory = join(temporaryRoot, "consumer");
  await mkdir(consumerDirectory);
  await writeFile(
    join(consumerDirectory, "package.json"),
    JSON.stringify({ name: "package-smoke", private: true, type: "module" }),
  );
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarballPath],
    { cwd: consumerDirectory, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      "const api = await import('speech-provider'); if (typeof api.getVoiceProvider !== 'function') throw new Error('Missing getVoiceProvider export');",
    ],
    { cwd: consumerDirectory, stdio: "inherit" },
  );
  console.log("Packed package import passed");
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
