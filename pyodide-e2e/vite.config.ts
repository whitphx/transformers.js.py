import { defineConfig } from "vite";
import path from "path";
import { version as pyodideVersion } from "pyodide";
import { exec } from "child_process";

const getTransformersJsPyVersion = (): Promise<string> =>
  new Promise((resolve, reject) => {
    exec(
      `python -c "import importlib.metadata; print(importlib.metadata.version('transformers_js_py'))"`,
      {
        cwd: path.resolve(__dirname, ".."),
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve(stdout.trim());
        }
      },
    );
  });

function injectPyodideVersionPlugin() {
  return {
    name: "inject-pyodide-version-into-index-html",
    transformIndexHtml: {
      order: "pre" as const,
      handler: (html: string): string =>
        html.replace("%PYODIDE_VERSION%", pyodideVersion),
    },
    transform(code, id) {
      const fileUrl = new URL(id, "file://"); // id may contains query string, so parse it as URL
      const fileBasename = path.basename(fileUrl.pathname);
      if (fileBasename === "worker.ts") {
        return code.replace("%PYODIDE_VERSION%", pyodideVersion);
      }
      return code;
    },
  };
}

export default defineConfig(async () => {
  const transformersJsPyVersion = await getTransformersJsPyVersion();
  console.debug({ transformersJsPyVersion });

  return {
    plugins: [injectPyodideVersionPlugin()],
    resolve: {
      alias: {
        "transformers-js-py.whl": path.resolve(
          __dirname,
          "..",
          "dist",
          `transformers_js_py-${transformersJsPyVersion}-py3-none-any.whl`,
        ),
      },
    },
    assetsInclude: ["**/*.whl"],
    test: {
      testTimeout: 60 * 1000,
      hookTimeout: 60 * 1000,
      browser: {
        provider: "playwright",
        name: "chromium",
        enabled: true,
        headless: true,
      },
    },
  };
});
