import fs from "node:fs";

const envText = fs.readFileSync(
  ".env.local",
  "utf8",
);

for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (
    !trimmed ||
    trimmed.startsWith("#")
  ) {
    continue;
  }

  const index = trimmed.indexOf("=");

  if (index === -1) {
    continue;
  }

  const key = trimmed.slice(0, index);
  const value = trimmed.slice(index + 1);

  process.env[key] = value;
}

console.log(
  "SOLANA_RPC_URL:",
  Boolean(process.env.SOLANA_RPC_URL),
);

console.log(
  "REWARDS_WALLET_ADDRESS:",
  Boolean(
    process.env.REWARDS_WALLET_ADDRESS,
  ),
);

console.log(
  "REWARDS_WALLET_SECRET_KEY:",
  Boolean(
    process.env.REWARDS_WALLET_SECRET_KEY,
  ),
);

console.log(
  "Configuration loaded successfully.",
);