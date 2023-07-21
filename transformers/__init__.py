import pyodide.ffi
import pyodide.code
import js


async def import_transformers_js():
    pyodide.code.run_js(
    """
    async function loadTransformersJs() {
        const transformers = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.4.1');
        globalThis._transformers = {  // Convert a module to an object.
            ...transformers,
        };
    }
    """)
    loadTransformersJsFn = js.loadTransformersJs
    await loadTransformersJsFn()

    transformers = js._transformers
    return transformers
