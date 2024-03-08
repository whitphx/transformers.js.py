import type Pyodide from "pyodide";

import wheelUrl from "transformers-js-py.whl"; // This is the alias from vite.config.ts

declare let loadPyodide: () => Promise<Pyodide.PyodideInterface>;

async function main() {
  const pyodide = await loadPyodide();

  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(wheelUrl);

  await micropip.install(["numpy", "Pillow"]);

  await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()
import numpy as np

pipeline = transformers.pipeline
RawImage = transformers.RawImage

raw_image = await RawImage.fromURL('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/bread_small.png')

depth_estimator = await pipeline('depth-estimation', 'Xenova/depth-anything-small-hf')
depth = await depth_estimator(raw_image._js_obj)
print(depth)
print(np.asarray(depth["predicted_depth"].data))

depth_map = depth["predicted_depth"].to_numpy()
print(depth_map)
`);
}
main();
// const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: "module" })
