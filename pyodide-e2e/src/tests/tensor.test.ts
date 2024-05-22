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

  it("can be accessed by index", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
import numpy as np

transformers = await import_transformers_js()

Tensor = transformers.Tensor
tensor = Tensor(np.array([1, 2, 3], dtype=np.float32))

value = tensor[1]
nparray = value.to_numpy()
assert nparray.ndim == 0
scalar = float(nparray)
`);
    const scalar = await pyodide.globals.get("scalar");
    expect(scalar).toBe(2);
  });

  it("can be sliced", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
import numpy as np

transformers = await import_transformers_js()

Tensor = transformers.Tensor
tensor = Tensor("float32", [1, 2, 3, 4, 5, 6], [2, 3])

sliced = tensor[1, 1:3]
nparray = sliced.to_numpy()
`);
    const nparray = await pyodide.globals.get("nparray").toJs();
    expect(nparray).toEqual(new Float32Array([5, 6]));
  });
});
