import { defineConfig } from 'vite'
import path from "path";
import { exec } from "child_process"

const getTransformersJsPyVersion = (): Promise<string> => new Promise((resolve, reject) => {
  exec("poetry version -s", {
    cwd: path.resolve(__dirname, ".."),
  }, (err, stdout, stderr) => {
    if (err) {
      reject(err);
    } else {
      resolve(stdout.trim());
    }
  });
})

export default defineConfig(async () => {
  const transformersJsPyVersion = await getTransformersJsPyVersion();
  console.debug({ transformersJsPyVersion });

  return {
    resolve: {
      alias: {
        "transformers-js-py.whl": path.resolve(__dirname, "..", "dist", `transformers_js_py-${transformersJsPyVersion}-py3-none-any.whl`),
      }
    },
    assetsInclude: ["**/*.whl"],
  }
})
