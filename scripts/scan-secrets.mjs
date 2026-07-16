import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".json",
  ".md",
  ".sql",
  ".env",
  ".example"
]);

const patterns = [
  { name: "OpenAI key", regex: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: "Supabase JWT-like token", regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { name: "AWS access key", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Private key", regex: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/ }
];

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => allowedExtensions.has(extname(file)) || file.includes(".env"));

const findings = [];

for (const file of files) {
  const fullPath = join(process.cwd(), file);
  const text = readFileSync(fullPath, "utf8");
  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      findings.push(`${pattern.name}: ${file}`);
    }
  }
}

if (findings.length) {
  console.error("Potential secrets found:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("No obvious secrets found.");
