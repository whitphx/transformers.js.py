import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

import { downloadFile } from "./utils";

describe("read_audio() and ASR", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest(["scipy"]);
  });

  it("can read an audio file from a local file", async () => {
    await downloadFile(
      pyodide,
      "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav",
      "/tmp/jfk.wav",
    );

    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js, read_audio
import numpy as np

transformers = await import_transformers_js()
pipeline = transformers.pipeline
pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en')

audio = read_audio("/tmp/jfk.wav", 16000)
result = await pipe(audio)
text = result["text"]
`);
    const text = await pyodide.globals.get("text");
    expect(text).toEqual(
      " And so my fellow Americans ask not what your country can do for you, ask what you can do for your country.",
    );
  });
});
