import asyncio
import traceback
import pyodide.ffi
import pyodide.code
import js


async def load_transformers_js():
    pyodide.code.run_js(
    """
    async function loadTransformersJs() {
        const transformers = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.4.1');
        console.log({ transformers });
        globalThis.transformers = {  // Convert a module to an object.
            ...transformers,
        };
    }
    """)
    loadTransformersJsFn = js.loadTransformersJs
    await loadTransformersJsFn()

    # Debug:
    print("fetching transformers", js.transformers)
    transformers = js.transformers
    print("Fetched transformers: ", transformers)
    pipeline = transformers.pipeline
    print("pipeline", type(pipeline), pipeline)
    pipe = await transformers.pipeline('sentiment-analysis')
    print("pipe", type(pipe), pipe.typeof, pipe)
    out = await pipe._call('I love transformers!')  # _call() is https://github.com/xenova/transformers.js/blob/4e947aa65758919610ca1e60b0e5bbe577c145ba/src/utils/core.js#L74
    print("out", out.to_py())


# Debug:
task = asyncio.ensure_future(load_transformers_js())


def callback(fut: asyncio.Future):
    print("callback", fut)
    exc = fut.exception()
    if exc:
        trace_lines = traceback.format_exception(exc)
        for line in trace_lines:
            print(line)
    else:
        print("Result:", fut.result())


task.add_done_callback(callback)
