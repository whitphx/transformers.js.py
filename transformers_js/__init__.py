"""
This module was created as an alias for `transformers_js_py`
due to a historical reason that the original package name was `transformers_js`.
Ref: https://github.com/whitphx/transformers.js.py/issues/26
"""

from transformers_js_py import *  # noqa: F401, F403


def __getattr__(name):
    """Support using some objects proxying to Transformers.js API
    without explicit call of `import_transformers_js` function."""
    from transformers_js_py.lazy_import_proxies import get_lazy_import_tjs_proxy

    return get_lazy_import_tjs_proxy(name)
