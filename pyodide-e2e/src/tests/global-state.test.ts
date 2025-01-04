import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("Global state tests for proxies.py", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    // Set up Pyodide environment with default (no extra) requirements
    pyodide = await setupPyodideForTest();
  });

  it("imports multiple versions and verifies separate module instances", async () => {
    await pyodide.runPythonAsync(`
      from transformers_js_py import import_transformers_js

      # Import the first version
      transformers_v1 = await import_transformers_js("2.4.2")
      v1_ver = transformers_v1.env.version

      # Import the second version
      transformers_v2 = await import_transformers_js("3.0.0")
      v2_ver = transformers_v2.env.version

      # Capture versions for test
      test_versions = (v1_ver, v2_ver)
    `);
    const testVersions = await pyodide.globals.get("test_versions").toJs();
    expect(testVersions).toEqual(["2.4.2", "3.0.0"]);
  });

  it("verifies global _TRANSFORMERS_JS remains backward-compatible", async () => {
    await pyodide.runPythonAsync(`
      import sys
      from transformers_js_py import import_transformers_js, _TRANSFORMERS_JS

      try:
          print("Starting module import...", file=sys.stderr)
          transformers_new = await import_transformers_js("3.1.0")
          print("Module import completed", file=sys.stderr)
          
          print("Verifying module proxy...", file=sys.stderr)
          assert hasattr(transformers_new, "env"), "Module proxy should have env attribute"
          print("Module proxy verified", file=sys.stderr)
          
          print("Checking global reference...", file=sys.stderr)
          global_version = _TRANSFORMERS_JS.env.version
          print(f"Global version: {global_version}", file=sys.stderr)
      except Exception as e:
          print(f"Error occurred: {str(e)}", file=sys.stderr)
          raise
    `);
    const globalVersion = await pyodide.globals.get("global_version");
    expect(globalVersion).toBe("3.1.0");
  });

  it("reuses cached instance when importing same version", async () => {
    await pyodide.runPythonAsync(`
      from transformers_js_py import import_transformers_js

      # Import same version twice
      transformers_1 = await import_transformers_js("2.4.2")
      transformers_2 = await import_transformers_js("2.4.2")

      # Check if they are the same instance
      instances_match = transformers_1 is transformers_2
    `);
    const instancesMatch = await pyodide.globals.get("instances_match");
    expect(instancesMatch).toBe(true);
  });

  it("maintains separate proxy objects for different module instances", async () => {
    await pyodide.runPythonAsync(`
      from transformers_js_py import import_transformers_js
      import numpy as np

      # Import different versions
      transformers_1 = await import_transformers_js("2.4.2")
      transformers_2 = await import_transformers_js("3.0.0")

      # Create tensor objects from different versions
      tensor_1 = transformers_1.Tensor(np.array([1, 2, 3], dtype=np.float32))
      tensor_2 = transformers_2.Tensor(np.array([4, 5, 6], dtype=np.float32))

      # Store tensor values for comparison
      tensor_1_vals = tensor_1.tolist()
      tensor_2_vals = tensor_2.tolist()
    `);
    const tensor1Vals = await pyodide.globals.get("tensor_1_vals").toJs();
    const tensor2Vals = await pyodide.globals.get("tensor_2_vals").toJs();
    expect(tensor1Vals).toEqual([1, 2, 3]);
    expect(tensor2Vals).toEqual([4, 5, 6]);
  });
});
