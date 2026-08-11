"use client";

import type { ReactNode } from "react";

import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { ClientProvider } from "@solana/react";

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.mainnet-beta.solana.com";

export const solanaClient = createClient()
  .use(
    walletSigner({
      chain: "solana:mainnet",
    }),
  )
  .use(
    solanaRpc({
      rpcUrl,
    }),
  );

export type Area523SolanaClient =
  Awaited<typeof solanaClient>;

export default function SolanaProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClientProvider client={solanaClient}>
      {children}
    </ClientProvider>
  );
}