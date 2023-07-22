import path from "path"
import fsPromises from "fs/promises";
import { loadPyodide, PyodideInterface } from "pyodide";
import wheelUrl from "transformers-js-py.whl";  // This is the alias from vite.config.ts

const wheelFilePath = wheelUrl.replace(/^\/@fs/, "");
const wheelFileName = path.basename(wheelFilePath);

export async function setupPyodideForTest(): Promise<PyodideInterface> {
  const pyodide = await loadPyodide({
    indexURL: "node_modules/pyodide",  // pnpm puts pyodide at this path
  });
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");

  const wheelFileData = await fsPromises.readFile(wheelFilePath);

  const wheelFileEmfsPath = `/tmp/${wheelFileName}`;

  pyodide.FS.writeFile(wheelFileEmfsPath, wheelFileData);

  await micropip.install(`emfs://${wheelFileEmfsPath}`);

  await pyodide.runPythonAsync(`
from transformers_js import import_transformers_js
transformers = await import_transformers_js()
  `)

  return pyodide;
}
