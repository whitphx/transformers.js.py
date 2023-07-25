# Transformers.js.py
Use [Transformers.js](https://huggingface.co/docs/transformers.js/index) on [Pyodide](https://pyodide.org/en/stable/) and Pyodide-based frameworks such as [stlite (Streamlit)](https://github.com/whitphx/stlite), [PyScript](https://pyscript.net/), and so on.

The original [Transformers](https://huggingface.co/docs/transformers/index) can't be used on a browser environment. [Transformers.js](https://huggingface.co/docs/transformers.js/index) is a JavaScript version of Transformers installable on browsers, but we can't use it from Pyodide.
This package is a thin wrapper of Transformers.js to proxy its API to Pyodide.

## API

The API is more like Transformers.js than the original Transformers.

<table>
<tr>
<th width="440px" align="center"><b>Transformers.js</b></th>
<th width="440px" align="center"><b>Transformers.js.py</b></th>
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

out = await pipe(text)
# [{'label': 'POSITIVE', 'score': 0.999817686}]
```

</td>
</tr>
</table>


## Examples

### stlite

[🎈Online Demo](https://edit.share.stlite.net/#!ChBzdHJlYW1saXRfYXBwLnB5EvwDChBzdHJlYW1saXRfYXBwLnB5EucDCuQDaW1wb3J0IHN0cmVhbWxpdCBhcyBzdAoKZnJvbSB0cmFuc2Zvcm1lcnNfanMgaW1wb3J0IGltcG9ydF90cmFuc2Zvcm1lcnNfanMKCnN0LnRpdGxlKCJTZW50aW1lbnQgYW5hbHlzaXMiKQoKdGV4dCA9IHN0LnRleHRfaW5wdXQoIklucHV0IHNvbWUgdGV4dCIpCgppZiB0ZXh0OgogICAgd2l0aCBzdC5zcGlubmVyKCk6CiAgICAgICAgdHJhbnNmb3JtZXJzID0gYXdhaXQgaW1wb3J0X3RyYW5zZm9ybWVyc19qcygpCiAgICAgICAgcGlwZWxpbmUgPSB0cmFuc2Zvcm1lcnMucGlwZWxpbmUKICAgICAgICBpZiAicGlwZSIgbm90IGluIHN0LnNlc3Npb25fc3RhdGU6CiAgICAgICAgICAgIHN0LnNlc3Npb25fc3RhdGVbInBpcGUiXSA9IGF3YWl0IHBpcGVsaW5lKCdzZW50aW1lbnQtYW5hbHlzaXMnKQogICAgICAgIHBpcGUgPSBzdC5zZXNzaW9uX3N0YXRlWyJwaXBlIl0KICAgICAgICBvdXQgPSBhd2FpdCBwaXBlKHRleHQpCiAgICBzdC53cml0ZShvdXQpChoSdHJhbnNmb3JtZXJzX2pzX3B5)

```python
import streamlit as st

from transformers_js import import_transformers_js

st.title("Sentiment analysis")

text = st.text_input("Input some text")

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

### PyScript
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
