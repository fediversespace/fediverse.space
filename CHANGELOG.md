# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

- Fixed some instances being duplicated (due to un-normalized data).

### Security

## [2.3.0 - 2019-08-02]

### Added

- Instance administrators can now log in to opt in or out of crawling.
- Added ElasticSearch full-text search over instance domains and descriptions.
- Search results are now highlighted on the graph.
- When you hover a search result, it is now highlighted on the graph.
- Instance details now show activity rate (average number of statuses posted per day).
- It's now possible to color code by activity rate.

### Changed

- Instances are now crawled hourly instead of every 30 minutes.
- There are now 100 concurrent crawl workers by default (increased from 50).
- The colors for color coding have been made brighter (more visible against the dark background).

### Fixed

- Fixed a process leak that could cause the server to OOM.
- Domains are no longer added to the queue twice.

### Security

- The server administrator can now be notified if there's a new potential spam domain.

## [2.2.0 - 2019-07-24]

### Added

- It is now possible to color code the graph by instance type (e.g. Mastodon, Pleroma, etc.)

## [2.1.0 - 2019-07-24]

### Added

- It's now shown in the front-end if an instance wasn't crawled because of its robots.txt.
- You can now link directly to instances at e.g. /instance/mastodon.social.
- Instance details now have a link to the corresponding fediverse.network page.
- The main graph is no longer displayed on mobile. Instead, a smaller neighborhood graph is shown.

### Changed

- You no longer have to zoom completely in to see labels.
- Label size is now dependent on the instance size.
- The instance lookup field is now front-and-center. Is also uses the backend for faster lookups. This is to improve
  performance, and it lays the groundwork for full-text search over instance names and descriptions.
- The reset-graph-view button now explains what it's for when you hover over it.

### Fixed

- Previously, direct links to /about would return a 404 on Netlify's infrastructure. No longer.

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

### Security

- Spam domains can be blacklisted in the backend crawler's config.
- Add basic automated security scanning (using [Sobelow](https://github.com/andmarti1424/sc-im.git) and Gitlab's dependency scanning).

## [1.0.0] - 2018-09-01

### Added

- Initial release. The date above is inaccurate; this first version was released sometime in the fall of 2018.
- This release had a Django backend and a [Sigma.js](http://sigmajs.org/) graph.
