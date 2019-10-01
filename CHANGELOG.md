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

- Display plain Pleroma version rather than the Mastodon-compatible string
- Fixed some unsuccessful crawls being saved without their errors

### Security

## [2.8.2 - 2019-08-31]

### Fixed

- Fix insularity score only working for > 0

## [2.8.1 - 2019-08-31]

### Fixed

- Fixed error when viewing some uncrawlable instances
- Fix navbar z-index
- Optimize query used for generating status rate

## [2.8.0 - 2019-08-29]

### Added

- Add support for logging in via an ActivityPub direct message to the instance admin.
- Added option to hide edges between instances if there are only mentions in one direction (off by default).
- Added note to neighbors tab to make it explicit that blocked instances may appear.
- Added federation tab that shows federation restrictions (only available for some Pleroma instances).
- Add tabular view of instances.

### Changed

- Edges are no longer shown between instances where one blocks the other (based on the federation list in nodeinfo).

## [2.7.1 - 2018-08-23]

### Added

- Add caching to graph + instance endpoints to better handle traffic spikes.

### Fixed

- Added ON DELETE to `most_recent_crawl` table, such that it can handle previously-crawled but now-dead instances.
- You can now login to the admin view by clicking, not just by pressing enter.
- Add handling for weirdly-formatted Friendica peers.
- If the details of an instance fail to load, it's now easy to dismiss the error.

## [2.7.0 - 2018-08-18]

### Added

- Add Friendica crawler (only supports peers; there's no timeline API endpoint.)
- Color more server types on the map -- Hubzilla, Plume, Pixelfed, and Wordpress.

### Changed

- Cleaned up ElasticSearch configuration in backend.

### Removed

- Remove color-coding by activity per user. The vast majority of instances had the exact same color so this wasn't very useful.

## [2.6.1 - 2019-08-10]

### Changed

- Added missing indices on `crawls` and `crawl_interactions` tables.
- Added table to store most recent crawl. This speeds up the instance view by a lot!

## [2.6.0 - 2019-08-10]

### Added

- Add nodeinfo and GNU Social crawler.
  - Thanks to nodeinfo, Peertube and Writefreely are now also displayed on the map.
  - Note that the information about connections comes from other instances.

### Changed

- You can now zoom slightly further out on the map to see more of the fediverse at once.

### Fixed

- Database deletions are now properly handled with `ON DELETE CASCADE` where necessary.

## [2.5.0 - 2019-08-08]

### Added

- Added Misskey crawler.

### Changed

- Crawl instances that are down or unrecognized less often.

### Fixed

- Fixed broken instance view on mobile devices.
- Increased database connection timeout - required as the database grows!

## [2.4.1 - 2019-08-04]

### Fixed

- Fixed a wonky search UI when there are no results.

## [2.4.0 - 2019-08-04]

### Added

- You can now click a button in the search bar to search (you can also still just press enter, of course).
- You can now filter searches by instance type.
- Added toggle to show/hide edges on graph.
- Full-text search across instance descriptions now supports the following languages: arabic, armenian, basque,
  bengali, brazilian, bulgarian, catalan, cjk (i.e. chinese, japanese, korean), czech, danish, dutch, english, finnish,
  french, galician, german, greek, hindi, hungarian, indonesian, irish, italian, latvian, lithuanian, norwegian,
  persian, romanian, russian, sorani, spanish, swedish, turkish, thai.

## [2.3.1 - 2019-08-03]

### Added

- Added a warning on mobile devices suggesting to view the site on a larger computer.

### Changed

- Performance improvements when opening the app on something that isn't the graph.
- There are now fewer irrelevant search results.
- Clarify that the admin page only works for Mastodon and Pleroma instances.

### Fixed

- Fixed some instances being duplicated (due to un-normalized data).
- Fixed mobile instance view erroring for uncrawled instances.
- Improved error handling in admin login page.
- Instances that opt-out will no longer show up in search results ever, nor are they accessible through the API.

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
