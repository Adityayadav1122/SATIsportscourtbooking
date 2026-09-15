// Shared env loader for scripts: reads real values from .env.local at the
// project root and falls back to process.env. Never hardcode secrets here.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function load() {
  const out = { ...process.env };
  try {
    const text = readFileSync(path.join(root, ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m && !(m[1] in out)) {
        const val = m[2].trim().replace(/^["']|["']$/g, "");
        out[m[1]] = val;
        process.env[m[1]] = val;
      }
    }
  } catch {
    // no .env.local present
  }
  return out;
}

export const env = load();