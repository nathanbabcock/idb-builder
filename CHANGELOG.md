# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-01-31

### Added

- Initial release
- Type-safe migrations with `createMigrations()` fluent API
- `openDB()` function for opening typed IndexedDB connections
- Support for primary keys (inline and out-of-line)
- Support for composite primary keys
- Support for auto-increment keys
- Support for indexes with `unique` and `multiEntry` options
- Support for nested key paths
- Compile-time schema validation with descriptive error messages
- Record transformation via `transformRecords()` for schema migrations

[unreleased]: https://github.com/nathanbabcock/idb-builder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nathanbabcock/idb-builder/releases/tag/v0.1.0
