import path from "path";
import fsPromises from "fs/promises";
import { loadPyodide, type PyodideInterface, version } from "pyodide";
import wheelUrl from "transformers-js-py.whl"; // This is the alias from vite.config.ts

export const IS_NODE = typeof window === "undefined";

export async function setupPyodideForTest(
  requirements: string[] = [],
): Promise<PyodideInterface> {
  const pyodide = await loadPyodide({
    indexURL: IS_NODE
      ? "node_modules/pyodide" // pnpm puts pyodide at this path
      : `https://cdn.jsdelivr.net/pyodide/v${version}/full/`, // In the CI env, it looks like only the remote URL works in web browser.
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

  await micropip.install(requirements);

  return pyodide;
}

export async function downloadFile(
  pyodide: PyodideInterface,
  url: string,
  path: string,
) {
  const response = await fetch(url);
  const fileData = await response.arrayBuffer();
  pyodide.FS.writeFile(path, new Uint8Array(fileData));
}
