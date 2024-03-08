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
      `transformers = await import_transformers_js()`,
    );
    const versionLatest = await pyodide.runPythonAsync(
      `transformers.env.version`,
    );
    const expectedLatestVersion = await fetch(
      "https://registry.npmjs.org/@xenova/transformers/latest",
    )
      .then((response) => response.json())
      .then((json) => json.version);
    expect(versionLatest).toBe(expectedLatestVersion);

    await pyodide.runPythonAsync(
      `transformers = await import_transformers_js("2.4.2")`,
    );
    const version242 = await pyodide.runPythonAsync(`transformers.env.version`);
    expect(version242).toBe("2.4.2");

    await pyodide.runPythonAsync(
      `transformers = await import_transformers_js("2.7.0")`,
    );
    const version270 = await pyodide.runPythonAsync(`transformers.env.version`);
    expect(version270).toBe("2.7.0");
  });
});
