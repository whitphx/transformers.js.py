import re
from typing import Any, Awaitable, Union

import js
import pyodide.code
import pyodide.ffi
import pyodide.webloop

from .url import as_url, is_url

try:
    import numpy as np
except ImportError:
    np = None  # type: ignore

try:
    import PIL.Image as PILImage
except ImportError:
    PILImage = None  # type: ignore


_TRANSFORMERS_JS = None


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


def convert_obj(obj: Any) -> Any:
    # Converts a Python object to be suitable for passing to Transformers.js API
    # through pyodide.ffi.to_js().
    if isinstance(obj, TjsProxy):
        return obj._js_obj
    if PILImage and isinstance(obj, PILImage.Image):
        return as_url(obj)
    return obj


def to_js(obj: Any) -> Any:
    # A wrapper around pyodide.ffi.to_js()
    # that should be used in all the TjsProxy methods.
    # It applies a custom object converter for Transformers.js
    # with a preset dict_converter which translates Python dict to JS object.
    return pyodide.ffi.to_js(
        convert_obj(obj),
        dict_converter=js.Object.fromEntries,  # Ref: https://pyodide.org/en/stable/usage/api/python-api/ffi.html#pyodide.ffi.to_js  # noqa: E501
    )


class TjsProxy:
    def __init__(self, js_obj: pyodide.ffi.JsProxy):
        self._js_obj = js_obj
        self._is_class = self._js_obj.typeof == "function" and rx_class_def_code.match(
            self._js_obj.toString()
        )  # Ref: https://stackoverflow.com/a/30760236/13103190

    def __call__(self, *args: Any, **kwds: Any) -> Any:
        args = tuple(to_js(arg) for arg in args)
        kwds = {k: to_js(v) for k, v in kwds.items()}

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
        value = to_js(value)
        self._js_obj[key] = value

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "_js_obj" or name == "_is_class":
            super().__setattr__(name, value)
        else:
            value = to_js(value)
            setattr(self._js_obj, name, value)


class TjsRawImageClassProxy(TjsProxy):
    def read(
        self, input: Union["TjsRawImageProxy", str]
    ) -> Awaitable["TjsRawImageProxy"]:
        if isinstance(input, TjsRawImageProxy):
            res = self._js_obj.read(input._js_obj)
        elif is_url(input):
            res = self._js_obj.read(input)
        else:
            res = self._js_obj.read(as_url(input))
        return wrap_or_unwrap_proxy_object(res)


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


class TjsTensorProxy(TjsProxy):
    def to_numpy(self):
        if np is None:
            raise RuntimeError("numpy is not available")

        data = self._js_obj.data.to_py()
        dims = self._js_obj.dims.to_py()
        dtype = self._js_obj.type

        return np.asarray(data, dtype=dtype).reshape(dims)


def proxy_tjs_object(js_obj: pyodide.ffi.JsProxy):
    """A factory function that wraps a JsProxy object wrapping a Transformers.js object
    into a Python object of type TjsProxy or is subclass in the case of a special object
    such as RawImage.
    """
    if _TRANSFORMERS_JS is None:
        raise RuntimeError(
            "transformers_js_py.import_transformers_js() must be called first"
        )

    if js_obj == _TRANSFORMERS_JS.RawImage:
        return TjsRawImageClassProxy(js_obj)
    if js_obj.constructor == _TRANSFORMERS_JS.RawImage:
        return TjsRawImageProxy(js_obj)
    if js_obj.constructor == _TRANSFORMERS_JS.Tensor:
        return TjsTensorProxy(js_obj)
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
    loadTransformersJsFn = pyodide.code.run_js(
        """
    async (version) => {
        const isBrowserMainThread = typeof window !== 'undefined';
        const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        const isBrowser = isBrowserMainThread || isWorker;
        const transformers = await import(isBrowser ? 'https://cdn.jsdelivr.net/npm/@xenova/transformers@' + version : '@xenova/transformers');

        transformers.env.allowLocalModels = false;

        return {  // Convert a module to an object.
            ...transformers,
        };
    }
    """  # noqa: E501
    )
    global _TRANSFORMERS_JS
    _TRANSFORMERS_JS = await loadTransformersJsFn(version)
    return TjsModuleProxy(_TRANSFORMERS_JS)
