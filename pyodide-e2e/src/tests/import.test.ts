import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("import_transformers_js", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest();
  });

  it("can import specific version of Transformers.js", async () => {
    await pyodide.runPythonAsync(
      `from transformers_js_py import import_transformers_js`,
    );

    await pyodide.runPythonAsync(
      `transformers = await import_transformers_js()`,
    );
    const expectedLatestVersion = await fetch(
      "https://registry.npmjs.org/@huggingface/transformers/latest",
    )
      .then((response) => response.json())
      .then((json) => json.version);
    expect(pyodide.runPython(`transformers.env.version`)).toBe(
      expectedLatestVersion,
    );

    await pyodide.runPythonAsync(
      `transformers = await import_transformers_js("2.4.2")`,
    );
    expect(pyodide.runPython(`transformers.env.version`)).toBe("2.4.2");

    await pyodide.runPythonAsync(
      `transformers = await import_transformers_js("2.7.0")`,
    );
    expect(pyodide.runPython(`transformers.env.version`)).toBe("2.7.0");

    await pyodide.runPythonAsync(
      `transformers = await import_transformers_js("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1")`,
    );
    expect(pyodide.runPython(`transformers.env.version`)).toBe("2.17.1");

    await pyodide.runPythonAsync(
      `transformers = await import_transformers_js("3.0.0")`,
    );
    expect(pyodide.runPython(`transformers.env.version`)).toBe("3.0.0");

    await pyodide.runPythonAsync(
      `transformers = await import_transformers_js("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.0")`,
    );
    expect(pyodide.runPython(`transformers.env.version`)).toBe("3.1.0");
  });
});
