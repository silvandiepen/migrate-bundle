#!/usr/bin/env bun

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 🔎 Recursively search for file in ./apps
function findFile(filename, startPath = "apps") {
  let result = [];

  const walk = (dir) => {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (f === filename) {
        result.push(fullPath);
      }
    }
  };

  walk(startPath);
  return result;
}

let input = process.argv[2];
if (!input) {
  console.error("❌ Usage: ngxtension-bundle <filename or full path>");
  process.exit(1);
}

// Check if input is a full existing path
let targetPath = null;
if (fs.existsSync(input)) {
  targetPath = input;
} else {
  const filename = path.basename(input);
  const matches = findFile(filename);

  if (matches.length === 0) {
    console.error(`❌ No file found matching "${filename}" in the apps/ folder`);
    process.exit(1);
  } else if (matches.length > 1) {
    console.log(`❗ Multiple files found matching "${filename}":`);
    matches.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
    console.log("👉 Please specify the full path to avoid ambiguity.");
    process.exit(1);
  } else {
    targetPath = matches[0];
    console.log(`✅ Found: ${targetPath}`);
  }
}

const commands = [
  `nx g ngxtension:convert-signal-inputs --path=${targetPath}`,
  `nx g ngxtension:convert-outputs --path=${targetPath}`,
  `nx g ngxtension:convert-queries --path=${targetPath}`,
  `nx g @angular/core:control-flow-migration --format=false --path=${targetPath}`,
  `nx g ngxtension:convert-di-to-inject --path=${targetPath}`
];

for (const cmd of commands) {
  console.log(`🚀 Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}
