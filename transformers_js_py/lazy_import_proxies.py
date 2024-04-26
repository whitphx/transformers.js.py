from .proxies import import_transformers_js


class LazyImportProxy:
    """
    This is a meta proxy object that calls `import_transformers_js()` to import the Transformers.js
    and then calls the Transformers.js.py's proxy object (`.proxies.TjsProxy`)
    of the specified method or attribute.
    This makes it possible to import the proxy object of some method or attribute
    such as `pipeline()` from the `transformers_js_py` package without calling `import_transformers_js()` explicitly,
    in combination with the `__getattr__` method in the `transformers_js_py` package.
    """

    def __init__(self, name_segments: list[str]):
        self._name_segments = name_segments

    async def __call__(self, *args, **kwargs):
        transformers = await import_transformers_js()
        obj = transformers
        for name in self._name_segments:
            obj = getattr(obj, name)
        return await obj(*args, **kwargs)

    def __getattr__(self, name: str):
        return LazyImportProxy(self._name_segments + [name])

    def __repr__(self):
        return f"{self.__class__.__name__}({'.'.join(self._name_segments)})"


def get_deferred_import_proxy(tjs_object_name: str):
    return LazyImportProxy([tjs_object_name])
