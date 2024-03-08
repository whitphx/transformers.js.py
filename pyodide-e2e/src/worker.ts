/// <reference lib="webworker" />

console.log("WebWorker started");

import type Pyodide from "pyodide";

import wheelUrl from "transformers-js-py.whl"; // This is the alias from vite.config.ts

import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.mjs";

async function main() {
  const pyodide: Pyodide.PyodideInterface = await loadPyodide();

  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(wheelUrl);

  await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()

pipeline = transformers.pipeline

pipe = await pipeline('sentiment-analysis')
out = await pipe('I love transformers!')
print("out", out)
`);
}

main();
