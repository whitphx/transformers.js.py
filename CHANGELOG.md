# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.18.0] - 2024-05-22

### Added

- `import_transformers_js` also accepts a URL not only a version string, [#164](https://github.com/whitphx/transformers.js.py/pull/164).
- `TjsTensorProxy` now supports slicing, [#163](https://github.com/whitphx/transformers.js.py/pull/163).

## [0.17.1] - 2024-05-03

### Fixed

- `numpy` typing in the `audio` module, [#152](https://github.com/whitphx/transformers.js.py/pull/152).

## [0.17.0] - 2024-05-02

### Added

- Make `TjsProxy` a subclass of `collections.abc.Mapping`, [#151](https://github.com/whitphx/transformers.js.py/pull/151).

## [0.16.0] - 2024-05-01

### Added

- `TjsProxy.__repr__`, [#149](https://github.com/whitphx/transformers.js.py/pull/149).

## [0.15.0] - 2024-05-01

### Added

- Set `numpy` and `scipy` as `[audio]` extra dependencies, [#148](https://github.com/whitphx/transformers.js.py/pull/148).

## [0.14.0] - 2024-04-27

### Added

- `LazyImportTjsProxy.__call__` now supports calling a synchronous proxied function, [#147](https://github.com/whitphx/transformers.js.py/pull/147).

## [0.13.0] - 2024-04-27

### Fixed

- Add the lazy-import proxy to the `transformers_js` alias module too, [#144](https://github.com/whitphx/transformers.js.py/pull/144).
- Rename `LazyImportProxy` to `LazyImportTjsProxy`, [#145](https://github.com/whitphx/transformers.js.py/pull/145).
- Rename `get_deferred_import_proxy` to `get_lazy_import_tjs_proxy`, [#146](https://github.com/whitphx/transformers.js.py/pull/146)

## [0.12.0] - 2024-04-26

### Added

- Support direct importing of the proxied objects such as `pipeline()` from the `transformers_js_py` module by deferring the async import of the Transformers.js library internally until the first call of the proxied object, [#142](https://github.com/whitphx/transformers.js.py/pull/142).

## [0.11.0] - 2024-04-16

### Changed

- Rename `TjsTensorProxy.numpy()` to `TjsTensorProxy.to_numpy()` for consistency.
