#!/usr/bin/env node

import { appendFileSync } from "node:fs";

const profiles = {
  rpi: [
    "aarch64_cortex-a72",
    "aarch64_cortex-a53",
    "arm_cortex-a7_neon-vfpv4",
    "arm_arm1176jzf-s_vfp",
  ],
  common: [
    "x86_64",
    "aarch64_generic",
    "aarch64_cortex-a53",
    "aarch64_cortex-a72",
    "arm_cortex-a7_neon-vfpv4",
    "arm_arm1176jzf-s_vfp",
  ],
  full: [
    "x86_64",
    "aarch64_generic",
    "aarch64_cortex-a53",
    "aarch64_cortex-a72",
    "arm_cortex-a7_neon-vfpv4",
    "arm_cortex-a15_neon-vfpv4",
    "arm_arm1176jzf-s_vfp",
    "mips_24kc",
    "mipsel_24kc",
    "mips64el_24kc",
  ],
};

const requested = (process.argv[2] || process.env.ARCH_PROFILE || "common").trim();
if (!profiles[requested]) {
  throw new Error(`Unknown OpenWrt architecture profile: ${requested}`);
}
const profile = requested;
const matrix = {
  include: profiles[profile].map((arch) => ({ arch })),
};

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `profile=${profile}\nmatrix=${JSON.stringify(matrix)}\n`,
  );
} else {
  process.stdout.write(`${JSON.stringify(matrix)}\n`);
}
