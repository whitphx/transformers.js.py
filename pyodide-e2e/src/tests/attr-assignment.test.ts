import type { PyodideInterface } from "pyodide";
import { beforeEach, suite, test, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

suite("Attribute assignment", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest();
  });

  test("Processor.feature_extractor.size can be updated", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js

transformers = await import_transformers_js()
AutoProcessor = transformers.AutoProcessor

processor = await AutoProcessor.from_pretrained('Xenova/yolov9-c');
`);

    const processor = await pyodide.globals.get("processor")._js_obj;
    expect(processor.feature_extractor.size).toEqual({
      width: 640,
      height: 640,
    });

    await pyodide.runPythonAsync(`
IMAGE_SIZE = 256;
processor.feature_extractor.size = { "width": IMAGE_SIZE, "height": IMAGE_SIZE }
`);
    expect(processor.feature_extractor.size).toEqual({
      width: 256,
      height: 256,
    });
  });
});
