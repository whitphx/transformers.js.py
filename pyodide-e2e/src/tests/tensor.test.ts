import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("Tensor", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest(["numpy"]);
  });

  it("can be initialized and be converted into a numpy array", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
import numpy as np

transformers = await import_transformers_js()

Tensor = transformers.Tensor
tensor = Tensor(np.array([1, 2, 3], dtype=np.float32))

nparray = tensor.to_numpy()
`);
    const nparray = await pyodide.globals.get("nparray").toJs();
    expect(nparray).toEqual(new Float32Array([1, 2, 3]));
  });
});
