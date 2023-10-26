import type { PyodideInterface } from "pyodide";
import { beforeEach, suite, test, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

suite("transformers.pipeline", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest();
  });

  test("zero-shot-image-classification with a local file wrapped by as_url()", async () => {
    await fetch("https://huggingface.co/spaces/gradio/image_mod/resolve/main/images/lion.jpg")
      .then((response) => response.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        const fileData = new Uint8Array(arrayBuffer);
        const filePath = "/tmp/cheetah.jpg";
        pyodide.FS.writeFile(filePath, fileData);
      });

    await pyodide.runPythonAsync(`
from transformers_js import import_transformers_js, as_url

transformers = await import_transformers_js()
pipeline = transformers.pipeline
pipe = await pipeline('zero-shot-image-classification')

image = "/tmp/cheetah.jpg"

data = await pipe(as_url(image), ["tower", "lion", "flower"])
result = {item['label']: round(item['score'], 2) for item in data}
`);
    const resultMap = await pyodide.globals.get("result").toJs();  // Python's dict to JS's Map
    const resultObj = Object.fromEntries(resultMap);
    expect(Object.keys(resultObj)).toEqual(["tower", "lion", "flower"]);

    const topLabel = Object.keys(resultObj).reduce((a, b) => resultObj[a] > resultObj[b] ? a : b);
    expect(topLabel).toEqual("lion");
  });

  test("automatic-speech-recognition model", async () => {
    await fetch("https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav")
      .then((response) => response.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        const fileData = new Uint8Array(arrayBuffer);
        const filePath = "/tmp/jfk.wav";
        pyodide.FS.writeFile(filePath, fileData);
      });

    await pyodide.runPythonAsync(`
from transformers_js import import_transformers_js, as_url

transformers = await import_transformers_js()
pipeline = transformers.pipeline
pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en')

audio_file = "/tmp/jfk.wav"

result = await pipe(as_url(audio_file))
`);
    const resultMap = await pyodide.globals.get("result").toJs();
    const resultObj = Object.fromEntries(resultMap);
    expect(resultObj).toEqual({
      "text": " And so my fellow Americans ask not what your country can do for you, ask what you can do for your country."
    });
  });
});
