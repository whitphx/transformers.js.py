import path from "path"
import fsPromises from "fs/promises";
import { loadPyodide, type PyodideInterface, version } from "pyodide";
import wheelUrl from "transformers-js-py.whl";  // This is the alias from vite.config.ts

export const IS_NODE = typeof window === 'undefined';

export async function setupPyodideForTest(): Promise<PyodideInterface> {
  const pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/`
  });
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");

  if (IS_NODE) {
    const wheelFilePath = wheelUrl.replace(/^\/@fs/, "");
    const wheelFileName = path.basename(wheelFilePath);
    const wheelFileData = await fsPromises.readFile(wheelFilePath);
    const wheelFileEmfsPath = `/tmp/${wheelFileName}`;
    pyodide.FS.writeFile(wheelFileEmfsPath, wheelFileData);
    await micropip.install(`emfs://${wheelFileEmfsPath}`);
  } else {
    await micropip.install(wheelUrl);
  }

  await pyodide.runPythonAsync(`
from transformers_js import import_transformers_js
transformers = await import_transformers_js()
  `)

  return pyodide;
}
