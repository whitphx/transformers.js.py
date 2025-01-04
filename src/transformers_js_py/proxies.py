import re
import sys
from collections.abc import Mapping
from typing import Any, Awaitable, Union

import js
import pyodide.code
import pyodide.ffi
import pyodide.webloop

from .url import as_url, is_url

# Debug logging configuration
DEBUG = True

def debug_log(msg: str) -> None:
    """Print debug messages to stderr if DEBUG is enabled."""
    if DEBUG:
        print(msg, file=sys.stderr, flush=True)

try:
    import numpy as np
except ImportError:
    np = None  # type: ignore

try:
    import PIL.Image as PILImage
except ImportError:
    PILImage = None  # type: ignore


_TRANSFORMERS_JS_INSTANCES: dict[str, pyodide.ffi.JsProxy] = {}
_TRANSFORMERS_JS: pyodide.ffi.JsProxy | None = None  # For backward compatibility


rx_class_def_code = re.compile(r"^\s*class\s+([a-zA-Z0-9_]+)\s*{", re.MULTILINE)


class TjsModuleProxy:
    # Use JavaScript WeakMap to store the mapping between JS objects and their Python proxies
    _instances_map = js.globalThis.WeakMap.new()

    def __new__(cls, js_obj: pyodide.ffi.JsProxy) -> "TjsModuleProxy":
        # Ensure we return the same proxy instance for the same JS object
        existing = cls._instances_map.get(js_obj)
        if existing is not None:
            return existing
        instance = super().__new__(cls)
        cls._instances_map.set(js_obj, instance)
        return instance

    def __init__(self, js_obj: pyodide.ffi.JsProxy):
        if not isinstance(js_obj, pyodide.ffi.JsProxy) or js_obj.typeof != "object":
            raise TypeError("js_obj must be a JS module object")
        if not hasattr(self, "js_obj"):  # Only set if not already initialized
            self.js_obj = js_obj

    def __getattr__(self, name: str) -> Any:
        res = getattr(self.js_obj, name)
        if isinstance(res, pyodide.ffi.JsProxy):
            # Pass the module instance for proper type checking
            return proxy_tjs_object(res, self.js_obj)
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


class TjsProxy(Mapping):
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

    def __getitem__(self, name: Any) -> Any:
        res = getattr(self._js_obj, name)
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

    def __iter__(self):
        return iter(self._js_obj.object_keys())

    def __len__(self):
        return len(self._js_obj.object_keys())


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
    def _compile_slice(self, py_slice: slice, dim_idx: int) -> tuple[int, int]:
        if py_slice.step is not None:
            raise ValueError("step is not supported for slicing")
        # `None` passed to JS is converted to `undefined`, but never `null` via Pyodide (see https://pyodide.org/en/stable/usage/type-conversions.html),
        # while Transformers.js strictly requires `null` for this purpose like https://github.com/xenova/transformers.js/blob/992f643e2a3fbbb3a962f213226bf2badf010d3c/src/utils/tensor.js#L257.
        # So, we need to convert `None` to the actual value of the dimension here before proxying them to JS.
        start = py_slice.start if py_slice.start is not None else 0
        stop = (
            py_slice.stop if py_slice.stop is not None else self._js_obj.dims[dim_idx]
        )
        return start, stop

    def __getitem__(self, key):
        if isinstance(key, tuple):
            # proxy[1, 2:3] will call this method with key=(1, slice(2, 3, None))
            slices: list[tuple[int, int] | int] = []
            for i, k in enumerate(key):
                if isinstance(k, slice):
                    slices.append(self._compile_slice(k, i))
                else:
                    slices.append(k)
        elif isinstance(key, slice):
            slices = [self._compile_slice(key, 0)]
        elif isinstance(key, int):
            slices = [key]
        else:
            return super().__getitem__(key)

        slices = pyodide.ffi.to_js(slices)
        res = self._js_obj.slice(*slices)
        return TjsTensorProxy(res)

    def to_numpy(self):
        if np is None:
            raise RuntimeError("numpy is not available")

        data = self._js_obj.data.to_py()
        dims = self._js_obj.dims.to_py()
        dtype = self._js_obj.type

        return np.asarray(data, dtype=dtype).reshape(dims)


def proxy_tjs_object(
    js_obj: pyodide.ffi.JsProxy, tjs_module: pyodide.ffi.JsProxy | None = None
):
    """A factory function that wraps a JsProxy object wrapping a Transformers.js object
    into a Python object of type TjsProxy or its subclass in the case of a special object
    such as RawImage.

    Args:
        js_obj: The JavaScript object to wrap.
        tjs_module: The Transformers.js module instance to use for type checking.
                   If None, uses the latest imported instance.

    Returns:
        A proxy object wrapping the JavaScript object.
    """
    module = tjs_module if tjs_module is not None else _TRANSFORMERS_JS
    if module is None:
        raise RuntimeError(
            "transformers_js_py.import_transformers_js() must be called first"
        )

    if js_obj == module.RawImage:
        return TjsRawImageClassProxy(js_obj)
    if js_obj.constructor == module.RawImage:
        return TjsRawImageProxy(js_obj)
    if js_obj.constructor == module.Tensor:
        return TjsTensorProxy(js_obj)
    return TjsProxy(js_obj)


def to_py_default_converter(value: pyodide.ffi.JsProxy, _ignored1, _ignored2):
    # Pyodide tries to convert the JS object to a Python object
    # as best as possible, but it doesn't always work.
    # In such a case, this custom converter is called
    # and it wraps the JS object into a TjsProxy object.
    # Note: Uses the latest imported module for backward compatibility
    return proxy_tjs_object(value, None)


def wrap_or_unwrap_proxy_object(obj, tjs_module: pyodide.ffi.JsProxy | None = None):
    if isinstance(obj, pyodide.ffi.JsProxy):
        if obj.typeof == "object":
            # Ensure we use the same module instance for type checking in the converter
            return obj.to_py(
                default_converter=lambda x, *_: proxy_tjs_object(x, tjs_module)
            )

        return proxy_tjs_object(obj, tjs_module)
    elif isinstance(obj, pyodide.webloop.PyodideFuture):
        return obj.then(lambda x: wrap_or_unwrap_proxy_object(x, tjs_module))
    return obj


async def import_transformers_js(version_or_url: str = "latest"):
    """Import Transformers.js module.

    Args:
        version_or_url: Version string or URL of Transformers.js to import.
                       If "latest", imports the latest version.

    Returns:
        TjsModuleProxy: A proxy object wrapping the imported Transformers.js module.
    """
    # If we already have a cached instance, return it
    if version_or_url in _TRANSFORMERS_JS_INSTANCES:
        return TjsModuleProxy(_TRANSFORMERS_JS_INSTANCES[version_or_url])

    loadTransformersJsFn = pyodide.code.run_js(
        """
    async (versionOrUrl) => {
        function getTransformersJsUrl() {
            try {
                return new URL(versionOrUrl);
            } catch {
                const version = versionOrUrl;
                const v3 = version === "latest" || version.startsWith("3.");
                const packageName = v3 ? '@huggingface/transformers' : '@xenova/transformers';
                return new URL(`https://cdn.jsdelivr.net/npm/${packageName}@${version}`);
            }
        }

        const isBrowserMainThread = typeof window !== 'undefined';
        const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
        const isBrowser = isBrowserMainThread || isWorker;

        const transformers = await import(isBrowser ? getTransformersJsUrl() : '@xenova/transformers');

        transformers.env.allowLocalModels = false;

        return {  // Convert a module to an object.
            ...transformers,
        };
    }
    """  # noqa: E501
    )

    try:
        # Load new instance
        debug_log(f"Loading module for version: {version_or_url}")
        new_module = await loadTransformersJsFn(version_or_url)
        debug_log("Module loaded successfully")

        # Create module proxy first to ensure proper initialization
        debug_log("Creating module proxy")
        module_proxy = TjsModuleProxy(new_module)
        debug_log("Module proxy created")

        # Update global reference for backward compatibility
        debug_log("Updating global reference")
        global _TRANSFORMERS_JS
        _TRANSFORMERS_JS = new_module
        debug_log("Global reference updated")

        # Cache the instance
        debug_log("Caching module instance")
        _TRANSFORMERS_JS_INSTANCES[version_or_url] = new_module
        debug_log("Module instance cached")

        return module_proxy
    except Exception as e:
        debug_log(f"Error in import_transformers_js: {str(e)}")
        raise
