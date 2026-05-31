#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const makefilePath = process.argv[2] || "zerotier/Makefile";
const overrideVersion = process.env.ZT_VERSION || "";
const overrideHash = process.env.ZT_HASH || "";
const noWrite = process.env.ZT_NO_WRITE === "1";
const githubToken = process.env.GITHUB_TOKEN || "";

function buildHeaders(extra = {}) {
  const headers = {
    "User-Agent": "zerotier-openwrt-bot",
    ...extra,
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }
  return headers;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: buildHeaders({
      Accept: "application/vnd.github+json",
    }),
  });
  if (!res.ok) {
    if (res.status === 403) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (remaining === "0" && !githubToken) {
        throw new Error(`HTTP 403 GitHub API rate limit exceeded for ${url}; provide GITHUB_TOKEN`);
      }
    }
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: buildHeaders(),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

let version = overrideVersion;
let hash = overrideHash;

if (!version || !hash) {
  const latest = await fetchJson("https://api.github.com/repos/zerotier/ZeroTierOne/releases/latest");
  const tagName = String(latest.tag_name || "").trim();
  if (!tagName) {
    throw new Error("Unable to resolve upstream tag name from GitHub release");
  }
  version = tagName.startsWith("v") ? tagName.slice(1) : tagName;
  const sourceUrl = `https://codeload.github.com/zerotier/ZeroTierOne/tar.gz/${version}?`;
  const tar = await fetchBuffer(sourceUrl);
  hash = createHash("sha256").update(tar).digest("hex");
}

const content = readFileSync(makefilePath, "utf8");
const hasVersionLine = /^PKG_VERSION:=.*$/m.test(content);
const hasHashLine = /^PKG_HASH:=.*$/m.test(content);
if (!hasVersionLine || !hasHashLine) {
  throw new Error(`Cannot find PKG_VERSION/PKG_HASH in ${makefilePath}`);
}

const patched = content
  .replace(/^PKG_VERSION:=.*$/m, `PKG_VERSION:=${version}`)
  .replace(/^PKG_HASH:=.*$/m, `PKG_HASH:=${hash}`);

if (!noWrite) {
  writeFileSync(makefilePath, patched);
}

if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    `version=${version}\nhash=${hash}\n`,
    { flag: "a" },
  );
}

process.stdout.write(`${version}\n${hash}\n`);
