import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("RawImage", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest();
  });

  it("can be initialized via .fromURL()", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()
RawImage = transformers.RawImage
raw_image = await RawImage.fromURL('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/bread_small.png')
    `)
    const rawImage = await pyodide.globals.get("raw_image").toJs();
    expect(rawImage).toBeDefined();
    expect(rawImage).toHaveProperty("width", 640);
    expect(rawImage).toHaveProperty("height", 424);
    expect(rawImage).toHaveProperty("channels", 4);
  })
})
