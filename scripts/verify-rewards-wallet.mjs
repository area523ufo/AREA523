import fs from "node:fs";
import {
  createKeyPairSignerFromBytes,
} from "@solana/kit";

const envText = fs.readFileSync(
  ".env.local",
  "utf8",
);

function getEnv(name) {
  const line = envText
    .split(/\r?\n/)
    .find((value) =>
      value.startsWith(`${name}=`)
    );

  if (!line) {
    throw new Error(
      `${name} is missing`,
    );
  }

  return line.slice(name.length + 1).trim();
}

const expectedAddress =
  getEnv("REWARDS_WALLET_ADDRESS");

const secretRaw =
  getEnv("REWARDS_WALLET_SECRET_KEY");

let secretBytes;

try {
  const parsed = JSON.parse(secretRaw);

  if (
    !Array.isArray(parsed) ||
    parsed.length !== 64
  ) {
    throw new Error(
      "Expected 64-byte JSON array",
    );
  }

  secretBytes =
    new Uint8Array(parsed);
} catch {
  throw new Error(
    "REWARDS_WALLET_SECRET_KEY must currently be a 64-byte JSON array.",
  );
}

const signer =
  await createKeyPairSignerFromBytes(
    secretBytes,
  );

console.log(
  "Rewards wallet key matches:",
  signer.address === expectedAddress,
);

console.log(
  "Derived address:",
  signer.address,
);

console.log(
  "Configured address:",
  expectedAddress,
);