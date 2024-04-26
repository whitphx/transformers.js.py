# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.12.0] - 2024-04-26

### Added

- Support direct importing of the proxied objects such as `pipeline()` from the `transformers_js_py` module by deferring the async import of the Transformers.js library internally until the first call of the proxied object, [#142](https://github.com/whitphx/transformers.js.py/pull/142).

## [0.11.0] - 2024-04-16

### Changed

- Rename `TjsTensorProxy.numpy()` to `TjsTensorProxy.to_numpy()` for consistency.
