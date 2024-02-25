import type { PyodideInterface } from "pyodide";
import { beforeEach, suite, test, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

suite("transformers.pipeline", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest(["numpy", "Pillow"]);
  });

  test("zero-shot-image-classification with a local file wrapped by as_url()", async () => {
    await fetch("https://huggingface.co/spaces/gradio/image_mod/resolve/e07924a/images/lion.jpg")
      .then((response) => response.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        const fileData = new Uint8Array(arrayBuffer);
        const filePath = "/tmp/cheetah.jpg";
        pyodide.FS.writeFile(filePath, fileData);
      });

    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js, as_url

transformers = await import_transformers_js()
pipeline = transformers.pipeline
pipe = await pipeline('zero-shot-image-classification')

image = "/tmp/cheetah.jpg"

data = await pipe(as_url(image), ["tower", "lion", "flower"])
result = {item['label']: round(item['score'], 2) for item in data}
`);
    const resultMap = await pyodide.globals.get("result").toJs();  // Python's dict to JS's Map
    const resultObj = Object.fromEntries(resultMap);
    expect(Object.keys(resultObj)).toEqual(["lion", "tower", "flower"]);

    const topLabel = Object.keys(resultObj).reduce((a, b) => resultObj[a] > resultObj[b] ? a : b);
    expect(topLabel).toEqual("lion");
  });

  test("zero-shot-image-classification with a PIL image which is automatically converted to be an input URL", async () => {
    await fetch("https://huggingface.co/spaces/gradio/image_mod/resolve/e07924a/images/lion.jpg")
      .then((response) => response.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        const fileData = new Uint8Array(arrayBuffer);
        const filePath = "/tmp/cheetah.jpg";
        pyodide.FS.writeFile(filePath, fileData);
      });

    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js, as_url
import PIL.Image

transformers = await import_transformers_js()
pipeline = transformers.pipeline
pipe = await pipeline('zero-shot-image-classification')

image = PIL.Image.open("/tmp/cheetah.jpg")

data = await pipe(image, ["tower", "lion", "flower"])
result = {item['label']: round(item['score'], 2) for item in data}
`);
    const resultMap = await pyodide.globals.get("result").toJs();  // Python's dict to JS's Map
    const resultObj = Object.fromEntries(resultMap);
    expect(Object.keys(resultObj)).toEqual(["lion", "tower", "flower"]);

    const topLabel = Object.keys(resultObj).reduce((a, b) => resultObj[a] > resultObj[b] ? a : b);
    expect(topLabel).toEqual("lion");
  });

  test("depth-estimation", async () => {
    await fetch("https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/db8bd36/bread_small.png")
      .then((response) => response.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        const fileData = new Uint8Array(arrayBuffer);
        const filePath = "/tmp/bread_small.png";
        pyodide.FS.writeFile(filePath, fileData);
      });

    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js, as_url

transformers = await import_transformers_js()

pipeline = transformers.pipeline
RawImage = transformers.RawImage

depth_estimator = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf');

output = await depth_estimator(as_url("/tmp/bread_small.png"))
`);
    const outputMap = await pyodide.globals.get("output").toJs()  // Python's dict to JS's Map
    const output = Object.fromEntries(outputMap);

    const depth = output.depth.toJs();
    const predictedDepth = output.predicted_depth.toJs();

    // API reference: https://huggingface.co/Xenova/depth-anything-small-hf
    expect(depth.width).toBe(640)
    expect(depth.height).toBe(424)
    expect(depth.channels).toBe(1)
    expect(predictedDepth).toBeDefined()

    await pyodide.runPythonAsync(`
output["depth"].save('/tmp/depth.png')
`);
    const depthImage: Uint8Array = pyodide.FS.readFile("/tmp/depth.png", { encoding: "binary" });
    // TODO: How to assert the depth image? Image snapshot is not available in the browser env.
  })

  test("depth-estimation with a RawImage input", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js, as_url

transformers = await import_transformers_js()

pipeline = transformers.pipeline
RawImage = transformers.RawImage

depth_estimator = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf');

image = await RawImage.fromURL('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/db8bd36/bread_small.png')

output = await depth_estimator(image)
`);
    const outputMap = await pyodide.globals.get("output").toJs()  // Python's dict to JS's Map
    const output = Object.fromEntries(outputMap);

    const depth = output.depth.toJs();
    const predictedDepth = output.predicted_depth.toJs();

    // API reference: https://huggingface.co/Xenova/depth-anything-small-hf
    expect(depth.width).toBe(640)
    expect(depth.height).toBe(424)
    expect(depth.channels).toBe(1)
    expect(predictedDepth).toBeDefined()

    await pyodide.runPythonAsync(`
output["depth"].save('/tmp/depth.png')
`);
    const depthImage: Uint8Array = pyodide.FS.readFile("/tmp/depth.png", { encoding: "binary" });
    // TODO: How to assert the depth image? Image snapshot is not available in the browser env.
  })
});
