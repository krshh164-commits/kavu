import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";

const output = "dist/client";
const base = "/kavu/";

async function rewrite(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewrite(path);
      continue;
    }

    if (![".html", ".js", ".css"].includes(extname(entry.name))) continue;
    const source = await readFile(path, "utf8");
    const updated = source.replaceAll("/assets/", `${base}assets/`);
    if (updated !== source) await writeFile(path, updated);
  }
}

await mkdir(output, { recursive: true });
await rewrite(output);
await writeFile(join(output, ".nojekyll"), "");
