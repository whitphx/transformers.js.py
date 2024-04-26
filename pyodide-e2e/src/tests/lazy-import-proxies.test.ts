import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("transformers_js_py.pipeline()", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest(["scipy"]);
  });

  it("can be imported from the package and loads Transformers.js internally when called", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import pipeline

pipe = await pipeline("text-classification")

result = await pipe("I love Transformers!")
`);
    const resultMap = await pyodide.globals.get("result").toJs(); // Array<Map>
    const resultObj = Object.fromEntries(resultMap[0]);
    expect(resultObj).toEqual({
      label: "POSITIVE",
      score: expect.any(Number),
    });
  });
});

describe("transformers_js_py.RawImage", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest(["scipy"]);
  });

  it("can be imported from the package and loads Transformers.js internally when its static methods called", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import RawImage

raw_image = await RawImage.read("https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/db8bd36/bread_small.png")
`);
    const rawImage = await pyodide.globals.get("raw_image").toJs();
    expect(rawImage).toBeDefined();
    expect(rawImage).toHaveProperty("width", 640);
    expect(rawImage).toHaveProperty("height", 424);
    expect(rawImage).toHaveProperty("channels", 4);
  });
});

describe("transformers_js_py.AutoProcessor", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest(["scipy"]);
  });

  it("can be imported from the package and loads Transformers.js internally when its static methods called", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import AutoProcessor

processor = await AutoProcessor.from_pretrained('Xenova/yolov9-c');
`);
    const processor = await pyodide.globals.get("processor")._js_obj;
    expect(processor.feature_extractor.size).toEqual({
      width: 640,
      height: 640,
    });
  });
});
