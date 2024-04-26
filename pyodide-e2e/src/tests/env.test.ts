import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("transformers.env", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest();
  });

  it("is available", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()
    `);

    const allowRemoteModels = await pyodide.runPythonAsync(
      `transformers.env.allowRemoteModels`,
    );
    expect(allowRemoteModels).toBeTypeOf("boolean");
  });

  it("is configurable", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()
    `);

    await pyodide.runPythonAsync(`transformers.env.allowRemoteModels = False`);
    const allowRemoteModels = await pyodide.runPythonAsync(
      `transformers.env.allowRemoteModels`,
    );
    expect(allowRemoteModels).toBe(false);

    await pyodide.runPythonAsync(`transformers.env.allowRemoteModels = True`);
    const allowRemoteModels2 = await pyodide.runPythonAsync(
      `transformers.env.allowRemoteModels`,
    );
    expect(allowRemoteModels2).toBe(true);

    await pyodide.runPythonAsync(`transformers.env.allowRemoteModels = False`);
    const allowRemoteModels3 = await pyodide.runPythonAsync(
      `transformers.env.allowRemoteModels`,
    );
    expect(allowRemoteModels3).toBe(false);
  });
});
