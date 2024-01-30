import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("RawImage", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest(["numpy", "Pillow"]);
  });

  it("can be initialized via .fromURL()", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()
RawImage = transformers.RawImage
raw_image = await RawImage.fromURL('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/db8bd36/bread_small.png')
    `)
    const rawImage = await pyodide.globals.get("raw_image").toJs();
    expect(rawImage).toBeDefined();
    expect(rawImage).toHaveProperty("width", 640);
    expect(rawImage).toHaveProperty("height", 424);
    expect(rawImage).toHaveProperty("channels", 4);
  });

  it("can be initialized from a local file via .read()", async () => {
    await fetch("https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/db8bd36/bread_small.png")
      .then((response) => response.blob())
      .then((blob) => blob.arrayBuffer())
      .then((arrayBuffer) => {
        const fileData = new Uint8Array(arrayBuffer);
        const filePath = "/tmp/bread_small.png";
        pyodide.FS.writeFile(filePath, fileData);
      });

    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()

RawImage = transformers.RawImage
raw_image = await RawImage.read("/tmp/bread_small.png")
    `)
    const rawImage = await pyodide.globals.get("raw_image").toJs();
    expect(rawImage).toBeDefined();
    expect(rawImage).toHaveProperty("width", 640);
    expect(rawImage).toHaveProperty("height", 424);
    expect(rawImage).toHaveProperty("channels", 4);
  });

  it("can be initialized via the constructor", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()

RawImage = transformers.RawImage
raw_image = RawImage(bytes([0] * 16*10*3), 16, 10, 3)
    `)

    const rawImage = await pyodide.globals.get("raw_image").toJs();
    expect(rawImage).toBeDefined();
    expect(rawImage).toHaveProperty("width", 16);
    expect(rawImage).toHaveProperty("height", 10);
    expect(rawImage).toHaveProperty("channels", 3);
  });

  it("can be transformed into a numpy array and a PIL image and saved to a local file", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()
RawImage = transformers.RawImage
raw_image = await RawImage.fromURL('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/db8bd36/bread_small.png')

numpy_array = raw_image.to_numpy()
pil_image = raw_image.to_pil()
raw_image.save('/tmp/bread_small.png')
    `)
    const numpyArrayProxy = await pyodide.globals.get("numpy_array");
    const numpyArray = numpyArrayProxy.getBuffer("u8");
    expect(numpyArray.shape).toEqual([424, 640, 4]);

    const pilImage = await pyodide.globals.get("pil_image")
    expect(pilImage.width).toBe(640);
    expect(pilImage.height).toBe(424);
    expect(pilImage.mode).toBe("RGBA");
  });

  describe("Color transform methods such as .grayscale(), rgb(), and .rgba()", async () => {
    ([["grayscale", 1], ["rgb", 3], ["rgba", 4]] as const).forEach(([source, sourceChannels]) => {
      describe(`${source} image`, () => {
        beforeEach(async () => {
          await pyodide.runPythonAsync(`
from transformers_js_py import import_transformers_js
transformers = await import_transformers_js()

RawImage = transformers.RawImage
raw_image = RawImage(bytes([0] * 16*10*3), 16, 10, ${sourceChannels})
`)
        });

        ([["grayscale", 1], ["rgb", 3], ["rgba", 4]] as const).forEach(([target, targetChannels]) => {
          it(`can be transformed into a ${target} image`, async () => {
            await pyodide.runPythonAsync(`
converted_image = raw_image.${target}()
`)
            const convertedImage = await pyodide.globals.get("converted_image").toJs();
            expect(convertedImage).toBeDefined();
            expect(convertedImage).toHaveProperty("width", 16);
            expect(convertedImage).toHaveProperty("height", 10);
            expect(convertedImage).toHaveProperty("channels", targetChannels);
          });
        });

      });
    });
  });
})
