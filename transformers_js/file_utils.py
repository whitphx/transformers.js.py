import warnings
from typing import Union

import pyodide.ffi
from js import URL as js_URL

try:
    from js import Blob as js_Blob
except ImportError:
    warnings.warn("Blob is not available in this environment")
    js_Blob = None


def as_url(data_or_file_path: Union[str, bytes]) -> str:
    """For example, `pipeline('zero-shot-image-classification')`
    requires a URL of the input image file in the browser environment.
    This function converts a file path on Pyodide's virtual file system
    to a URL that can be used as the input of such pipelines.

    Internally, Transformers.js reads the input with this code:
    https://github.com/xenova/transformers.js/blob/2.6.2/src/utils/image.js#L112-L113
    Inside it `fetch()` is used. `fetch()` accepts a BlobURL.
    """

    if js_Blob is None:
        raise RuntimeError("Blob is not available in this environment")

    if isinstance(data_or_file_path, str):
        with open(data_or_file_path, "rb") as f:
            data = f.read()
    elif isinstance(data_or_file_path, bytes):
        data = data_or_file_path
    else:
        raise TypeError(
            "data_or_file_path must be str or bytes, "
            f"but got {type(data_or_file_path)}"
        )

    js_data = pyodide.ffi.to_js(data)
    js_blob_obj = js_Blob.new([js_data])
    return js_URL.createObjectURL(js_blob_obj)
