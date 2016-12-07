# Change Log
All notable changes to this project will be documented in this file.

## [Unreleased]

## [v0.1.5] - 2016-12-07
### Fixed
- Cast function is now called also for hexadecimal numbers.

## [v0.1.4] - 2015-12-03
### Fixed
- Correct handling of multiple framed messages, which are now correctly
  returned by repeated calls to `Parser.parseMessage()`.

## [v0.1.3] - 2015-12-02
### Added
- Support for HEP-1 Value Annotations.
- Added this change log.

### Fixed
- Fixed a couple of situations in which a `ReferenceError` would have been
  thrown; now a `hipack.ParseError` are correctly thrown.

[Unreleased]: https://github.com/aperezdc/hipack-js/compare/v0.1.5...HEAD
[v0.1.5]: https://github.com/aperezdc/hipack-js/compare/v0.1.4...v0.1.5
[v0.1.4]: https://github.com/aperezdc/hipack-js/compare/v0.1.3...v0.1.4
[v0.1.3]: https://github.com/aperezdc/hipack-js/compare/v0.1.2...v0.1.3
