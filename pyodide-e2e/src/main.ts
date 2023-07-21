import wheelUrl from "../../dist/transformers_js_py-0.1.0-py3-none-any.whl?url";

declare var loadPyodide: () => Promise<any>;

async function main() {
  const pyodide = await loadPyodide();

  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(wheelUrl);

  await pyodide.runPythonAsync(`
from transformers import import_transformers_js
transformers = await import_transformers_js()

pipeline = transformers.pipeline

pipe = await pipeline('sentiment-analysis')
out = await pipe('I love transformers!')
print("out", out.to_py())
`);
}
main();
