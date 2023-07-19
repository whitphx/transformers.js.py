import wheelUrl from "../../dist/transformers_js_py-0.1.0-py3-none-any.whl?url";

declare var loadPyodide: () => Promise<any>;

async function main() {
  const pyodide = await loadPyodide();

  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(wheelUrl);

  await pyodide.runPythonAsync(`
import transformers
`);
}
main();
