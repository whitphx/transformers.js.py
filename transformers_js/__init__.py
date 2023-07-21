from typing import Any

import js
import pyodide.code
import pyodide.ffi
import pyodide.webloop


class TjsModuleProxy:
    def __init__(self, js_obj: pyodide.ffi.JsProxy):
        if not isinstance(js_obj, pyodide.ffi.JsProxy) or js_obj.typeof != "object":
            raise TypeError("js_obj must be a JS module object")
        self.js_obj = js_obj

    def __getattr__(self, name: str) -> Any:
        res = getattr(self.js_obj, name)
        if isinstance(res, pyodide.ffi.JsProxy):
            return TjsProxy(res)
        return res

    def __repr__(self) -> str:
        return "TjsModuleProxy({})".format(", ".join(self.js_obj.object_keys()))


class TjsProxy:
    def __init__(self, js_obj: pyodide.ffi.JsProxy):
        self.js_obj = js_obj

    def __call__(self, *args: Any, **kwds: Any) -> Any:
        if hasattr(self.js_obj, "_call"):
            # Transformers.js uses a custom _call() method
            # to make the JS classes callable.
            # https://github.com/xenova/transformers.js/blob/2.4.1/src/utils/core.js#L45-L77
            res = self.js_obj._call(*args, **kwds)
        else:
            res = self.js_obj(*args, **kwds)

        return wrap_or_unwrap_proxy_object(res)

    def __getattr__(self, name: str) -> Any:
        res = getattr(self.js_obj, name)
        return wrap_or_unwrap_proxy_object(res)

    def __getitem__(self, key: Any) -> Any:
        res = self.js_obj[key]
        return wrap_or_unwrap_proxy_object(res)

    def __setitem__(self, key: Any, value: Any) -> None:
        self.js_obj[key] = value


def wrap_or_unwrap_proxy_object(obj):
    if isinstance(obj, pyodide.ffi.JsProxy):
        if obj.typeof == "object":
            return obj.to_py()
        return TjsProxy(obj)
    elif isinstance(obj, pyodide.webloop.PyodideFuture):
        return obj.then(wrap_or_unwrap_proxy_object)
    return obj


async def import_transformers_js():
    pyodide.code.run_js(
        """
    async function loadTransformersJs() {
        const transformers = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.4.1');
        globalThis._transformers = {  // Convert a module to an object.
            ...transformers,
        };
    }
    """  # noqa: E501
    )
    loadTransformersJsFn = js.loadTransformersJs
    await loadTransformersJsFn()

    transformers = js._transformers
    return TjsModuleProxy(transformers)
