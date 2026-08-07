import {
  Connection,
  PublicKey,
} from "@solana/web3.js";

const MINT =
  "AQcchjgVmPiAhFwzAWbUa76eXZTt6ofuKs48hSoLPHkj";

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed",
);

const mint = new PublicKey(MINT);

const [metadataPda] =
  PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID,
  );

console.log("Mint:");
console.log(mint.toBase58());

console.log("\nMetadata PDA:");
console.log(metadataPda.toBase58());

const accountInfo =
  await connection.getAccountInfo(metadataPda);

if (!accountInfo) {
  console.log(
    "\nMetaplex metadata account NOT FOUND.",
  );

  process.exit(0);
}

console.log(
  "\nMetaplex metadata account EXISTS.",
);

console.log(
  "Owner:",
  accountInfo.owner.toBase58(),
);

console.log(
  "Data length:",
  accountInfo.data.length,
);

console.log(
  "Lamports:",
  accountInfo.lamports,
);
