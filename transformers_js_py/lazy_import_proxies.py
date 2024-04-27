from typing import Awaitable

from .proxies import import_transformers_js


class LazyImportTjsProxy:
    """
    This is a proxy object that not only proxies function calls and attr accesses to the Transformers.js APIs,
    but also imports the Transformers.js library by calling `import_transformers_js()` when calling the proxy object.
    Importing the Transformers.js library is deferred until the proxy object is called,
    so the developer can use the proxy object and access its attributes without awaiting the import
    until it is actually needed by calling the proxy object.
    This makes it possible to import the proxy object of some method or attribute
    such as `pipeline()` from the `transformers_js_py` package directly,
    in combination with the `__getattr__` method in the `transformers_js_py` package.
    """

    def __init__(self, name_segments: list[str]):
        # Represents the path to the object in the Transformers.js library.
        # e.g. ["pipeline"] or ["RawImage", "read"]
        self._name_segments = name_segments

    async def __call__(self, *args, **kwargs):
        transformers = await import_transformers_js()
        obj = transformers
        for name in self._name_segments:
            obj = getattr(obj, name)
        res = obj(*args, **kwargs)
        if isinstance(res, Awaitable):
            return await res
        return res

    def __getattr__(self, name: str):
        return LazyImportTjsProxy(self._name_segments + [name])

    def __repr__(self):
        return f"{self.__class__.__name__}({'.'.join(self._name_segments)})"


def get_lazy_import_tjs_proxy(tjs_object_name: str):
    return LazyImportTjsProxy([tjs_object_name])
