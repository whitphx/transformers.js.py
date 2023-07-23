// @vitest-environment node

import { test, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

test("transformers.js version consistency between the package loaded from CDN at runtime and in unit tests on Node.", async () => {
  const pyodide = await setupPyodideForTest();

  const nodeInstalledTjsVersionForTest = await pyodide.runPythonAsync(`transformers.env.version`);
  const cdnTjsVersion = await pyodide.runPythonAsync(`from transformers_js import TRANSFORMERS_JS_CDN_VERSION; TRANSFORMERS_JS_CDN_VERSION`);
  expect(nodeInstalledTjsVersionForTest).toEqual(cdnTjsVersion);
})
