import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("as_url()", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest(["numpy", "Pillow"]);
  });

  it("converts a file system URL into a URL", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import as_url

with open("test.bin", "wb") as f:
    f.write(b"test")

url = as_url("test.bin")
`);
    const url = await pyodide.globals.get("url");
    expect(url).toMatch(/^blob:/);
  });

  it("converts a bytes variable into a URL", async () => {
    await pyodide.runPythonAsync(`
from transformers_js_py import as_url

url = as_url(b"test")
`);
    const url = await pyodide.globals.get("url");
    expect(url).toMatch(/^blob:/);
  });

  it("converts a PIL image into a URL", async () => {
    await pyodide.runPythonAsync(`
from PIL import Image
from transformers_js_py import as_url

img = Image.new("RGB", (100, 100), "black")
url = as_url(img)
`);
    const url = await pyodide.globals.get("url");
    expect(url).toMatch(/^blob:/);
  });
});
