# Changelog

All notable changes to this project will be documented in this file.

## [2.2.1] - 2026-10-27

### Fixed

- Add the `storage` permission required by `browser.storage.local`, without which the popup failed to initialize after the update.

## [2.2.0] - 2026-10-27

### Added

- GitHub Actions CI running lint, formatting check and build.

### Changed

- Update deps.
- Store the API key in `browser.storage.local` instead of `localStorage` (the
  key is migrated automatically on update).
- Show API error details (e.g. an already taken custom code) instead of a
  generic error message.
- Allow logging in by pressing Enter in the API key input.
- Use the `browser` polyfill consistently instead of `chrome.tabs`.
- Translate the toolbar buttons alt texts.

### Fixed

- Clear cached folders on login and logout to avoid showing folders of a previously logged account.
- Validate the API key against the API before switching to the shorten view.
- Reset the shorten button state between shortens, so multiple links can be shortened in one popup session.
- Clear previous error and copied messages between actions.
- Handle corrupted cache entries and clipboard failures gracefully.

## [2.1.0] - 2026-08-10

### Changed

- Update deps

## [2.0.0] - 2026-05-19

### Changed

- Switched to API v2, which now uses API key authentication instead of username and password.

## [1.2.2] - 2025-07-24

### Fixed

- Fix sign up link.

## [1.2.1] - 2024-09-04

### Fixed

- Fix state of extension if token is deleted.

## [1.2.0] - 2024-07-03

### Added

- Add custom code support.

### Fixed

- Fixed width issues.

## [1.1.2] - 2024-05-31

### Fixed

- Fixed margin issues.
- Remove an unused permission.

## [1.1.1] - 2024-05-31

### Added

- Add Sign-up link on login view.

### Fixed

- Remove an unused permission.

## [1.1.0] - 2024-05-30

### Added

- Back in the game!

## [1.0.7] - 2020-06-05

### Fixed

- Add more icons for manifest.

## [1.0.6] - 2020-06-05

### Added

- Compatibility with Google Chrome.

## [1.0.5] - 2020-05-25

### Added

- Send locale of the user with the link.

## [1.0.4] - 2020-05-08

### Changed

- Just reflect a backend change.

## [1.0.3] - 2020-05-07

### Added

- French translation.

## [1.0.2] - 2020-05-06

### Added

- Improve error messages.

## [1.0.1] - 2020-05-04

### Added

- Initial version.
