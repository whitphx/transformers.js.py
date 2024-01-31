import re
from typing import Any, Union

import js
import pyodide.code
import pyodide.ffi
import pyodide.webloop

from .url import as_url

try:
    import numpy as np
except ImportError:
    np = None

try:
    import PIL.Image as PILImage
except ImportError:
    PILImage = None


rx_class_def_code = re.compile(r"^\s*class\s+([a-zA-Z0-9_]+)\s*{", re.MULTILINE)


class TjsModuleProxy:
    def __init__(self, js_obj: pyodide.ffi.JsProxy):
        if not isinstance(js_obj, pyodide.ffi.JsProxy) or js_obj.typeof != "object":
            raise TypeError("js_obj must be a JS module object")
        self.js_obj = js_obj

    def __getattr__(self, name: str) -> Any:
        res = getattr(self.js_obj, name)
        if isinstance(res, pyodide.ffi.JsProxy):
            return proxy_tjs_object(res)
        return res

    def __repr__(self) -> str:
        return "TjsModuleProxy({})".format(", ".join(self.js_obj.object_keys()))


class TjsProxy:
    def __init__(self, js_obj: pyodide.ffi.JsProxy):
        self._js_obj = js_obj
        self._is_class = self._js_obj.typeof == "function" and rx_class_def_code.match(
            self._js_obj.toString()
        )  # Ref: https://stackoverflow.com/a/30760236/13103190

    def __call__(self, *args: Any, **kwds: Any) -> Any:
        args = [arg._js_obj if isinstance(arg, TjsProxy) else arg for arg in args]
        kwds = {k: v._js_obj if isinstance(v, TjsProxy) else v for k, v in kwds.items()}
        args = pyodide.ffi.to_js(args)
        kwds = pyodide.ffi.to_js(kwds)

        if hasattr(self._js_obj, "_call"):
            # Transformers.js uses a custom _call() method
            # to make the JS classes callable.
            # https://github.com/xenova/transformers.js/blob/2.4.1/src/utils/core.js#L45-L77
            res = self._js_obj._call(*args, **kwds)
        else:
            if self._is_class:
                res = self._js_obj.new(*args, **kwds)
            else:
                res = self._js_obj(*args, **kwds)

        return wrap_or_unwrap_proxy_object(res)

    def __getattr__(self, name: str) -> Any:
        res = getattr(self._js_obj, name)
        return wrap_or_unwrap_proxy_object(res)

    def __getitem__(self, key: Any) -> Any:
        res = self._js_obj[key]
        return wrap_or_unwrap_proxy_object(res)

    def __setitem__(self, key: Any, value: Any) -> None:
        self._js_obj[key] = value

    def __setattr__(self, __name: str, __value: Any) -> None:
        if __name == "_js_obj" or __name == "_is_class":
            super().__setattr__(__name, __value)
        else:
            setattr(self._js_obj, __name, __value)


class TjsRawImageClassProxy(TjsProxy):
    def read(self, input: Union["TjsRawImageProxy", str]):
        return wrap_or_unwrap_proxy_object(self._js_obj.read(as_url(input)))


class TjsRawImageProxy(TjsProxy):
    def to_numpy(self):
        if np is None:
            raise RuntimeError("numpy is not available")

        data = self._js_obj.data  # Uint8ClampedArray|Uint8Array
        width = self._js_obj.width
        height = self._js_obj.height
        channels = self._js_obj.channels
        return np.asarray(data.to_py()).reshape((height, width, channels))

    def to_pil(self):
        if PILImage is None:
            raise RuntimeError("PIL is not available")

        numpy_img = self.to_numpy()
        if numpy_img.shape[2] == 1:
            # Gray scale image
            numpy_img = numpy_img[:, :, 0]
        return PILImage.fromarray(numpy_img)

    def save(self, path: str):
        self.to_pil().save(path)


def proxy_tjs_object(js_obj: pyodide.ffi.JsProxy):
    """A factory function that wraps a JsProxy object wrapping a Transformers.js object
    into a Python object of type TjsProxy or is subclass in the case of a special object
    such as RawImage.
    """
    if js_obj == js._transformers.RawImage:
        return TjsRawImageClassProxy(js_obj)
    if js_obj.constructor == js._transformers.RawImage:
        return TjsRawImageProxy(js_obj)
    return TjsProxy(js_obj)


def to_py_default_converter(value: pyodide.ffi.JsProxy, _ignored1, _ignored2):
    # Pyodide tries to convert the JS object to a Python object
    # as best as possible, but it doesn't always work.
    # In such a case, this custom converter is called
    # and it wraps the JS object into a TjsProxy object.
    return proxy_tjs_object(value)


def wrap_or_unwrap_proxy_object(obj):
    if isinstance(obj, pyodide.ffi.JsProxy):
        if obj.typeof == "object":
            return obj.to_py(default_converter=to_py_default_converter)

        return proxy_tjs_object(obj)
    elif isinstance(obj, pyodide.webloop.PyodideFuture):
        return obj.then(wrap_or_unwrap_proxy_object)
    return obj


async def import_transformers_js(version: str = "latest"):
    pyodide.code.run_js(
        """
    async function loadTransformersJs(version) {
        const isBrowserMainThread = typeof window !== 'undefined';
        const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        const isBrowser = isBrowserMainThread || isWorker;
        const transformers = await import(isBrowser ? 'https://cdn.jsdelivr.net/npm/@xenova/transformers@' + version : '@xenova/transformers');

        transformers.env.allowLocalModels = false;

        globalThis._transformers = {  // Convert a module to an object.
            ...transformers,
        };
    }
    """  # noqa: E501
    )
    loadTransformersJsFn = js.loadTransformersJs
    await loadTransformersJsFn(version)

    transformers = js._transformers
    return TjsModuleProxy(transformers)


__all__ = ["as_url", "import_transformers_js"]
