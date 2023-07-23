// @vitest-environment node

import type { PyodideInterface } from "pyodide";
import { beforeEach, describe, it, expect } from "vitest";
import { setupPyodideForTest } from "./utils";

describe("transformers.env", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest();
  });

  it("is available", async () => {
    const allowRemoteModels = await pyodide.runPythonAsync(`transformers.env.allowRemoteModels`);
    expect(allowRemoteModels).toBeTypeOf("boolean");
  });
})
