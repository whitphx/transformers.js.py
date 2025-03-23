import importlib.metadata

__version__: str | None = None

try:
    __version__ = importlib.metadata.version(__name__)
except importlib.metadata.PackageNotFoundError:
    pass
