# Transformers.js.py 🤗

[![Test, Build, and Publish](https://github.com/whitphx/transformers.js.py/actions/workflows/main.yml/badge.svg)](https://github.com/whitphx/transformers.js.py/actions/workflows/main.yml)
[![PyPI](https://img.shields.io/pypi/v/transformers-js-py)](https://pypi.org/project/transformers-js-py/)

**Use [Transformers.js](https://huggingface.co/docs/transformers.js/index) on [Pyodide](https://pyodide.org/en/stable/) and Pyodide-based frameworks such as [JupyterLite](https://jupyterlite.readthedocs.io/en/latest/), [stlite (Streamlit)](https://github.com/whitphx/stlite), [Shinylive (Shiny for Python)](https://shiny.posit.co/py/docs/shinylive.html), [PyScript](https://pyscript.net/), and so on.**

The original [Transformers](https://huggingface.co/docs/transformers/index) can't be used on a browser environment. [Transformers.js](https://huggingface.co/docs/transformers.js/index) is a JavaScript version of Transformers installable on browsers, but we can't use it from Pyodide.
This package is a thin wrapper of Transformers.js to proxy its API to Pyodide.


## API

The API is more like Transformers.js than the original Transformers.

<table>
<tr>
<th width="50%" align="center"><b>Transformers.js</b></th>
<th width="50%" align="center"><b>Transformers.js.py</b></th>
</tr>
<tr>
<td>

```javascript
import { pipeline } from '@xenova/transformers';

// Allocate a pipeline for sentiment-analysis
let pipe = await pipeline('sentiment-analysis');

let out = await pipe('I love transformers!');
// [{'label': 'POSITIVE', 'score': 0.999817686}]
```

</td>
<td>

```python
from transformers_js import import_transformers_js

transformers = await import_transformers_js()
pipeline = transformers.pipeline

# Allocate a pipeline for sentiment-analysis
pipe = await pipeline('sentiment-analysis')

out = await pipe('I love transformers!')
# [{'label': 'POSITIVE', 'score': 0.999817686}]
```

</td>
</tr>
</table>

See the [Transformers.js document](https://github.com/xenova/transformers.js/) for available features.

## Examples

### JupyterLite

![JupyterLite screenshot](./docs/images/JupyterLite.png)

👉Try this code snippet on https://jupyter.org/try-jupyter/lab/index.html

```python
%pip install transformers_js_py

from transformers_js import import_transformers_js

transformers = await import_transformers_js()
pipeline = transformers.pipeline

pipe = await pipeline('sentiment-analysis')

out = await pipe('I love transformers!')

print(out)
```

### stlite (Serverless Streamlit)

[![stlite sharing screenshot](./docs/images/stlite_sharing.png)](https://edit.share.stlite.net/#!ChBzdHJlYW1saXRfYXBwLnB5EpMEChBzdHJlYW1saXRfYXBwLnB5Ev4DCvsDaW1wb3J0IHN0cmVhbWxpdCBhcyBzdAoKZnJvbSB0cmFuc2Zvcm1lcnNfanMgaW1wb3J0IGltcG9ydF90cmFuc2Zvcm1lcnNfanMKCnN0LnRpdGxlKCJTZW50aW1lbnQgYW5hbHlzaXMiKQoKdGV4dCA9IHN0LnRleHRfaW5wdXQoIklucHV0IHNvbWUgdGV4dCIsICJJIGxvdmUgdHJhbnNmb3JtZXJzISIpCgppZiB0ZXh0OgogICAgd2l0aCBzdC5zcGlubmVyKCk6CiAgICAgICAgdHJhbnNmb3JtZXJzID0gYXdhaXQgaW1wb3J0X3RyYW5zZm9ybWVyc19qcygpCiAgICAgICAgcGlwZWxpbmUgPSB0cmFuc2Zvcm1lcnMucGlwZWxpbmUKICAgICAgICBpZiAicGlwZSIgbm90IGluIHN0LnNlc3Npb25fc3RhdGU6CiAgICAgICAgICAgIHN0LnNlc3Npb25fc3RhdGVbInBpcGUiXSA9IGF3YWl0IHBpcGVsaW5lKCdzZW50aW1lbnQtYW5hbHlzaXMnKQogICAgICAgIHBpcGUgPSBzdC5zZXNzaW9uX3N0YXRlWyJwaXBlIl0KICAgICAgICBvdXQgPSBhd2FpdCBwaXBlKHRleHQpCiAgICBzdC53cml0ZShvdXQpGhJ0cmFuc2Zvcm1lcnNfanNfcHk,)

[👉 Online Demo](https://edit.share.stlite.net/#!ChBzdHJlYW1saXRfYXBwLnB5EpMEChBzdHJlYW1saXRfYXBwLnB5Ev4DCvsDaW1wb3J0IHN0cmVhbWxpdCBhcyBzdAoKZnJvbSB0cmFuc2Zvcm1lcnNfanMgaW1wb3J0IGltcG9ydF90cmFuc2Zvcm1lcnNfanMKCnN0LnRpdGxlKCJTZW50aW1lbnQgYW5hbHlzaXMiKQoKdGV4dCA9IHN0LnRleHRfaW5wdXQoIklucHV0IHNvbWUgdGV4dCIsICJJIGxvdmUgdHJhbnNmb3JtZXJzISIpCgppZiB0ZXh0OgogICAgd2l0aCBzdC5zcGlubmVyKCk6CiAgICAgICAgdHJhbnNmb3JtZXJzID0gYXdhaXQgaW1wb3J0X3RyYW5zZm9ybWVyc19qcygpCiAgICAgICAgcGlwZWxpbmUgPSB0cmFuc2Zvcm1lcnMucGlwZWxpbmUKICAgICAgICBpZiAicGlwZSIgbm90IGluIHN0LnNlc3Npb25fc3RhdGU6CiAgICAgICAgICAgIHN0LnNlc3Npb25fc3RhdGVbInBpcGUiXSA9IGF3YWl0IHBpcGVsaW5lKCdzZW50aW1lbnQtYW5hbHlzaXMnKQogICAgICAgIHBpcGUgPSBzdC5zZXNzaW9uX3N0YXRlWyJwaXBlIl0KICAgICAgICBvdXQgPSBhd2FpdCBwaXBlKHRleHQpCiAgICBzdC53cml0ZShvdXQpGhJ0cmFuc2Zvcm1lcnNfanNfcHk,) : try out this code online.

```python
import streamlit as st

from transformers_js import import_transformers_js

st.title("Sentiment analysis")

text = st.text_input("Input some text", "I love transformers!")

if text:
    with st.spinner():
        transformers = await import_transformers_js()
        pipeline = transformers.pipeline
        if "pipe" not in st.session_state:
            st.session_state["pipe"] = await pipeline('sentiment-analysis')
        pipe = st.session_state["pipe"]
        out = await pipe(text)
    st.write(out)
```

### Shinylive

[![Shinylive screenshot](./docs/images/Shinylive.png)](https://shinylive.io/py/editor/#code=NobwRAdghgtgpmAXGKAHVA6VBPMAaMAYwHsIAXOcpMAMwCdiYACAZwAsBLCbJjmVYnTJMAgujxM6lACZw6EgK4cAOhHqMmZOlAgsag+HRYB9AFYte-QcL4ChxrTr0G5J86tVpUxpUwC8TEpYUADmcMY0ADZK0gAUqkyJgRwYXKgKZA5wAB5k8WAUucr4TMUAKjk2EOlkxRKokVCEcGzEkbJ0fsUAouRympXFAJR4CUlBxBk1WbnGAG5yAEZQZHz5ZEVgI6pDHhCqsjSscgt0sWkZEpNkNRIscCwsHKRDiGOJAALXNe9MH1IQDoYQq1CBJJhQFjYCCEJiHTS5WKvX7gjhHCDEKo1YGVJFvMHgwmJKRkBR0MHFSn7AlExy6fR0QwWAJQADuUA4Nis9jpzkZrjMLCRKKSqA4qDgkS4cH8mm09JcRiw4sl0r2RMSYolsrZHOEWtVEDg+Xu5D4lDIAFodFBItgnixhuqNdcdezOUwDedqhkcYihrtqRrJHBSeTWFpYtdA3svLKxKhYl4fBw7ic5BJZIsFCE-GU6Ao4IGwABfPDgaDwahSACOSik8HILGBuXwRFIFCoyF5DKZlvMlpwpYAukA)

[👉 Online demo](https://shinylive.io/py/editor/#code=NobwRAdghgtgpmAXGKAHVA6VBPMAaMAYwHsIAXOcpMAMwCdiYACAZwAsBLCbJjmVYnTJMAgujxM6lACZw6EgK4cAOhHqMmZOlAgsag+HRYB9AFYte-QcL4ChxrTr0G5J86tVpUxpUwC8TEpYUADmcMY0ADZK0gAUqkyJgRwYXKgKZA5wAB5k8WAUucr4TMUAKjk2EOlkxRKokVCEcGzEkbJ0fsUAouRympXFAJR4CUlBxBk1WbnGAG5yAEZQZHz5ZEVgI6pDHhCqsjSscgt0sWkZEpNkNRIscCwsHKRDiGOJAALXNe9MH1IQDoYQq1CBJJhQFjYCCEJiHTS5WKvX7gjhHCDEKo1YGVJFvMHgwmJKRkBR0MHFSn7AlExy6fR0QwWAJQADuUA4Nis9jpzkZrjMLCRKKSqA4qDgkS4cH8mm09JcRiw4sl0r2RMSYolsrZHOEWtVEDg+Xu5D4lDIAFodFBItgnixhuqNdcdezOUwDedqhkcYihrtqRrJHBSeTWFpYtdA3svLKxKhYl4fBw7ic5BJZIsFCE-GU6Ao4IGwABfPDgaDwahSACOSik8HILGBuXwRFIFCoyF5DKZlvMlpwpYAukA) : try out this code online.

```python
from shiny import App, render, ui
from transformers_js import import_transformers_js

app_ui = ui.page_fluid(
    ui.input_text("text", "Text input", placeholder="Enter text"),
    ui.output_text_verbatim("txt"),
)


def server(input, output, session):
    @output
    @render.text
    async def txt():
        if not input.text():
            return ""

        transformers = await import_transformers_js()
        pipeline = transformers.pipeline

        pipe = await pipeline('sentiment-analysis')

        out = await pipe(input.text())

        return str(out)


app = App(app_ui, server, debug=True)
```

### PyScript

![PyScript screenshot](./docs/images/PyScript.png)

👉Try this code snippet on https://pyscript.com/

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>
    <input type="text" value="" id="text-input" />
    <button py-click="run()" id="run-button">Run</button>

    <py-config>
        packages = ["transformers-js-py"]
    </py-config>
    <py-script>
        import asyncio
        from transformers_js import import_transformers_js

        text_input = Element("text-input")

        async def main(input_data):
            transformers = await import_transformers_js()
            pipeline = transformers.pipeline
            pipe = await pipeline('sentiment-analysis')
            out = await pipe(input_data)
            print(out)

        def run():
            print("Start")
            input_data = text_input.value
            if input_data.strip() == "":
                print("No data input.")
                return

            future = asyncio.ensure_future(main(input_data))
    </py-script>
  </body>
</html>

```
