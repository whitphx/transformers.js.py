import { defineConfig } from "vite";
import path from "path";
import { version as pyodideVersion } from "pyodide";
import { exec } from "child_process";

const getTransformersJsPyVersion = (): Promise<string> =>
  new Promise((resolve, reject) => {
    exec(
      "poetry version -s",
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
      enforce: "pre" as const,
      transform: (html: string): string =>
        html.replace("%PYODIDE_VERSION%", pyodideVersion),
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
        enabled: true,
        name: "chrome", // browser name is required
        headless: true,
      },
    },
  };
});
