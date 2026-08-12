"use client";

import { useMemo, useState } from "react";

import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
} from "@solana/kit-plugin-wallet/react";

import { useClient } from "@solana/react";

import type { Area523SolanaClient } from "@/components/SolanaProvider";
import { createClient } from "@/lib/supabase/client";
import { address as solanaAddress } from "@solana/kit";
function isValidSolanaAddress(value: string) {
  try {
    solanaAddress(value.trim());
    return true;
  } catch {
    return false;
  }
}

type WalletConnectButtonProps = {
  currentWalletAddress: string | null;
  onWalletSaved?: (address: string) => void;
};

export default function WalletConnectButton({
  currentWalletAddress,
  onWalletSaved,
}: WalletConnectButtonProps) {
  const client = useClient<Area523SolanaClient>();

  const wallets = useWallets(client);
  const connectedWallet =
    useConnectedWallet(client);

  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

  const [isOpen, setIsOpen] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const connectedAddress = useMemo(() => {
    return connectedWallet?.account.address ?? null;
  }, [connectedWallet]);

  async function saveWalletAddress(
    address: string,
  ) {
    if (!isValidSolanaAddress(address)) {
  setMessage("Invalid Solana wallet address.");
  return;
}
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error(
          "You must be logged in.",
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          wallet_address: address,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      setMessage("Wallet saved.");

      onWalletSaved?.(address);
    } catch (error) {
      console.error(
        "Wallet save failed:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Wallet could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (connectedAddress) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#48a7ff]/20 bg-[#48a7ff]/[0.06] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#69b7ff]">
              Connected Wallet
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-white/70">
              {connectedAddress.slice(0, 6)}
              ...
              {connectedAddress.slice(-6)}
            </p>
          </div>

          <button
            type="button"
            disabled={disconnect.isRunning}
            onClick={() =>
              disconnect.dispatch()
            }
            className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/45 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
          >
            {disconnect.isRunning
              ? "Disconnecting..."
              : "Disconnect"}
          </button>
        </div>

{connectedAddress !== currentWalletAddress && (
  <button
    type="button"
    disabled={isSaving}
    onClick={() =>
      void saveWalletAddress(
        connectedAddress,
      )
    }
    className="mt-3 w-full rounded-xl bg-[#48a7ff] px-4 py-3 text-sm font-black text-[#07111b] transition hover:bg-[#6bb8ff] disabled:cursor-not-allowed disabled:opacity-40"
  >
    {isSaving
      ? "Saving..."
      : "Save Connected Wallet"}
  </button>
)}

        {isSaving && (
          <p className="mt-2 text-xs text-white/30">
            Saving wallet...
          </p>
        )}

        {message && !isSaving && (
          <p className="mt-2 text-xs text-white/35">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setIsOpen((value) => !value)
        }
        className="w-full rounded-xl border border-[#48a7ff]/25 bg-[#48a7ff]/[0.08] px-4 py-3 text-sm font-black text-[#69b7ff] transition hover:border-[#48a7ff]/45 hover:bg-[#48a7ff]/[0.13]"
      >
        Connect Wallet
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#15191f] shadow-2xl">
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <button
                key={String(wallet.name)}
                type="button"
                disabled={connect.isRunning}
                onClick={() => {
                  setMessage(null);

                  connect.dispatch(wallet);

                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-left text-sm font-bold text-white/65 transition last:border-b-0 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
              >
              <span>
                {String(wallet.name)}
              </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-4 text-sm leading-6 text-white/40">
              No compatible Solana wallet was detected.
              Install Phantom, Solflare, or another Wallet
              Standard compatible wallet.
            </div>
          )}
        </div>
      )}

    {Boolean(connect.error) && (
  <p className="mt-2 text-xs text-red-300/70">
    Wallet connection failed.
  </p>
)}
      {message && (
        <p className="mt-2 text-xs text-red-300/70">
          {message}
        </p>
      )}
    </div>
  );
}