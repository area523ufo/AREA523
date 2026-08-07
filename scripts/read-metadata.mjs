import {
  Connection,
  PublicKey,
} from "@solana/web3.js";

const MINT =
  "AQcchjgVmPiAhFwzAWbUa76eXZTt6ofuKs48hSoLPHkj";

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);

const mint = new PublicKey(MINT);

const [metadataPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ],
  METADATA_PROGRAM_ID
);

const accountInfo = await connection.getAccountInfo(metadataPda);

if (!accountInfo) {
  console.log("Metadata account NOT FOUND.");
  process.exit(1);
}

const data = accountInfo.data;

let offset = 1;

// update authority
const updateAuthority = new PublicKey(
  data.subarray(offset, offset + 32)
);
offset += 32;

// mint
const metadataMint = new PublicKey(
  data.subarray(offset, offset + 32)
);
offset += 32;

function readString() {
  const length = data.readUInt32LE(offset);
  offset += 4;

  const value = data
    .subarray(offset, offset + length)
    .toString("utf8")
    .replace(/\0/g, "")
    .trim();

  offset += length;

  return value;
}

const name = readString();
const symbol = readString();
const uri = readString();

console.log("\n=== AREA METADATA ===");
console.log("Mint:", metadataMint.toBase58());
console.log("Metadata PDA:", metadataPda.toBase58());
console.log("Update Authority:", updateAuthority.toBase58());
console.log("Name:", name);
console.log("Symbol:", symbol);
console.log("URI:", uri);
