# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- It's now shown in the front-end if an instance wasn't crawled because of its robots.txt.
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [2.0.0] - 2019-07-20
### Added
- The backend has been completely rewritten in Elixir for improved stability and performance.
- An "insularity score" was added to show the percentage of mentions to users on the same instance.
- The crawler now respects robots.txt.
### Changed
- Migrated the frontend graph from Sigma.js to Cytoscape.js.
- To improve performance, instances with no neighbors are no longer shown on the graph.
### Deprecated
- The /api/v1 endpoint no longer exists; now there's a new /api.
### Removed
### Fixed
### Security
- Spam domains can be blacklisted in the backend crawler's config.
- Add basic automated security scanning (using [Sobelow](https://github.com/andmarti1424/sc-im.git) and Gitlab's dependency scanning).

## [1.0.0] - 2018-09-01
### Added
- Initial release. The date above is inaccurate; this first version was released sometime in the fall of 2018.
- This release had a Django backend and a [Sigma.js](http://sigmajs.org/) graph.
