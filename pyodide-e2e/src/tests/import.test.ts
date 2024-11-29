import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";
import { version } from "os";

describe("import_transformers_js", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest();
  });

  it("loads the latest version of Transformers.js by default", async () => {
    const expectedLatestVersion = await fetch(
      "https://registry.npmjs.org/@huggingface/transformers/latest",
    )
      .then((response) => response.json())
      .then((json) => json.version);

    await pyodide.runPythonAsync(
      `
from transformers_js_py import import_transformers_js

transformers = await import_transformers_js()
`,
    );

    expect(pyodide.runPython(`transformers.env.version`)).toBe(
      expectedLatestVersion,
    );
  });

  [
    { versionOrUrl: "2.4.2", expectedVersion: "2.4.2" },
    { versionOrUrl: "2.7.0", expectedVersion: "2.7.0" },
    {
      versionOrUrl: "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1",
      expectedVersion: "2.17.1",
    },
    { versionOrUrl: "3.0.0", expectedVersion: "3.0.0" },
    {
      versionOrUrl:
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.0",
      expectedVersion: "3.1.0",
    },
  ].forEach(({ versionOrUrl, expectedVersion }) => {
    it(`can import specific version of Transformers.js. (${versionOrUrl} => ${expectedVersion})`, async () => {
      await pyodide.runPythonAsync(
        `from transformers_js_py import import_transformers_js`,
      );

      await pyodide.runPythonAsync(
        `transformers = await import_transformers_js("${versionOrUrl}")`,
      );
      expect(pyodide.runPython(`transformers.env.version`)).toBe(
        expectedVersion,
      );
    });
  });
});
