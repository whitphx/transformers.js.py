// @vitest-environment node

import path from "path"
import fsPromises from "fs/promises";
import { loadPyodide, PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import wheelUrl from "transformers-js-py.whl";  // This is the alias from vite.config.ts

const wheelFilePath = wheelUrl.replace(/^\/@fs/, "");
const wheelFileName = path.basename(wheelFilePath);

describe("transformers.env", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await loadPyodide({
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
  });

  it("is available", async () => {
    const allowRemoteModels = await pyodide.runPythonAsync(`transformers.env.allowRemoteModels`);
    expect(allowRemoteModels).toBeTypeOf("boolean");
  });

  it("is configurable", async () => {
    await pyodide.runPythonAsync(`transformers.env.allowRemoteModels = False`);
    const allowRemoteModels = await pyodide.runPythonAsync(`transformers.env.allowRemoteModels`);
    expect(allowRemoteModels).toBe(false);

    await pyodide.runPythonAsync(`transformers.env.allowRemoteModels = True`);
    const allowRemoteModels2 = await pyodide.runPythonAsync(`transformers.env.allowRemoteModels`);
    expect(allowRemoteModels2).toBe(true);

    await pyodide.runPythonAsync(`transformers.env.allowRemoteModels = False`);
    const allowRemoteModels3 = await pyodide.runPythonAsync(`transformers.env.allowRemoteModels`);
    expect(allowRemoteModels3).toBe(false);
  });
})
