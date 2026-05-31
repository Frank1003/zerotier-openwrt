# ZeroTier-OpenWrt

This repo keeps the OpenWrt package and adds GitHub Actions that watch the upstream ZeroTier release, rebuild for Raspberry Pi OpenWrt targets, and publish a new GitHub Release when the version changes.

## Install

```sh
opkg install zerotier_*.apk
```

## Automation

- `multi-arch-test-build.yml` runs on push and pull request
- `auto-release.yml` checks the upstream ZeroTier release on a schedule
- the published release tag is `zerotier-v<version>`
