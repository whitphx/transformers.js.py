from .audio import read_audio
from .proxies import import_transformers_js
from .url import as_url

__all__ = ["as_url", "read_audio", "import_transformers_js"]


def __getattr__(name):
    """Support using some objects proxying to Transformers.js API
    without explicit call of `import_transformers_js` function."""
    from .lazy_import_proxies import get_lazy_import_tjs_proxy

    return get_lazy_import_tjs_proxy(name)
