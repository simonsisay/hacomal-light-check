import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else if (entry.isFile()) fs.copyFileSync(src, dest);
  }
}

copyDir(path.join(root, "src", "texts"), path.join(root, "dist", "texts"));

