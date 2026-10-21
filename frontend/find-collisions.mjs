import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".css") ? [p] : [];
  });
const isHome = (p) => p.replaceAll("\\", "/").includes("styles/home/");
const read = (p) => readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const scan = (files) => {
  const classes = new Map(), globals = new Set(), keyframes = new Set();
  for (const f of files) {
    const css = read(f);
    for (const [, k] of css.matchAll(/@keyframes\s+([\w-]+)/g)) keyframes.add(k);
    for (const [, pre] of css.matchAll(/([^{}]+)\{/g)) {
      const sel = pre.trim();
      if (sel.startsWith("@")) continue;
      for (const part of sel.split(",")) {
        const s = part.trim();
        if (!/[.#]/.test(s) && !/^(\d+%|from|to)$/.test(s)) globals.add(s);
      }
      for (const [, c] of sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
        if (!classes.has(c)) classes.set(c, new Set());
        classes.get(c).add(f);
      }
    }
  }
  return { classes, globals, keyframes };
};

const all = walk("src");
const home = scan(all.filter(isHome));
const rest = scan(all.filter((p) => !isHome(p)));

console.log("\n== Clases del home que TAMBIÉN existen en otros CSS ==");
for (const c of home.classes.keys())
  if (rest.classes.has(c)) console.log(`.${c}  <-  ${[...rest.classes.get(c)].join(", ")}`);

console.log("\n== Keyframes repetidos ==");
for (const k of home.keyframes) if (rest.keyframes.has(k)) console.log(k);

console.log("\n== Selectores globales en styles/home (afectan a todo el proyecto) ==");
console.log([...home.globals].join("\n"));

console.log("\n== Selectores globales en el resto de CSS (pueden filtrarse al home) ==");
console.log([...rest.globals].join("\n"));