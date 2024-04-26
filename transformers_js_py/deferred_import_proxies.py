from .proxies import import_transformers_js


async def pipeline(*args, **kwargs):
    transformers = await import_transformers_js()
    return await transformers.pipeline(*args, **kwargs)


class RawImage:
    @staticmethod
    async def read(*args, **kwargs):
        transformers = await import_transformers_js()
        return await transformers.RawImage.read(*args, **kwargs)

    @staticmethod
    async def fromURL(*args, **kwargs):
        transformers = await import_transformers_js()
        return await transformers.RawImage.fromURL(*args, **kwargs)
