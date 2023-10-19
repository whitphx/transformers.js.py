import warnings

import pyodide.ffi
from js import URL as js_URL

try:
    from js import Blob as js_Blob
except ImportError:
    warnings.warn("Blob is not available in this environment")
    js_Blob = None


def as_url(file_path: str) -> str:
    if js_Blob is None:
        raise RuntimeError("Blob is not available in this environment")

    with open(file_path, "rb") as f:
        data = f.read()
    js_data = pyodide.ffi.to_js(data)
    js_blob_obj = js_Blob.new([js_data])
    return js_URL.createObjectURL(js_blob_obj)
