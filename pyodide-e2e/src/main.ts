import type Pyodide from "pyodide"

import wheelUrl from "transformers-js-py.whl";  // This is the alias from vite.config.ts

declare let loadPyodide: () => Promise<Pyodide.PyodideInterface>;

async function main() {
  const pyodide = await loadPyodide();

  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(wheelUrl);

  await pyodide.runPythonAsync(`
from transformers_js import import_transformers_js
transformers = await import_transformers_js()

pipeline = transformers.pipeline

pipe = await pipeline('sentiment-analysis')
out = await pipe('I love transformers!')
print("out", out)
`);
}
main();
