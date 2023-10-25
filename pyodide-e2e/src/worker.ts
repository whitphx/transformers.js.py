/// <reference lib="webworker" />

console.log("WebWorker started");

import type Pyodide from "pyodide"

import wheelUrl from "transformers-js-py.whl";  // This is the alias from vite.config.ts

import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.mjs";

async function main() {
  const pyodide: Pyodide.PyodideInterface = await loadPyodide();

  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(wheelUrl);

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
  const result = await pyodide.globals.get("result").toJs();
  console.log({ result });
}

main();
