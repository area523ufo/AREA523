"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import WalletConnectButton from "@/components/WalletConnectButton";
import { createClient } from "@/lib/supabase/client";
import { address } from "@solana/kit";

type AreaWithdrawalPanelProps = {
  areaBalance: number;
  walletAddress: string | null;
};

type WithdrawalResult = {
  success?: boolean;
  withdrawalId?: string;
  amount?: number;
  rewardCount?: number;
  walletAddress?: string;
  status?: string;
};

function shortenWallet(address: string) {
  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function isValidSolanaAddress(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  try {
    address(trimmed);
    return true;
  } catch {
    return false;
  }
}

export default function AreaWithdrawalPanel({
  areaBalance,
  walletAddress,
}: AreaWithdrawalPanelProps) {
  const router = useRouter();

  const [manualWallet, setManualWallet] =
    useState(walletAddress ?? "");

  const [currentWallet, setCurrentWallet] =
    useState(walletAddress);

  const [isSavingWallet, setIsSavingWallet] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const normalizedWallet = useMemo(
    () => currentWallet?.trim() || null,
    [currentWallet],
  );

  async function saveManualWallet() {
    const address = manualWallet.trim();

  if (!isValidSolanaAddress(address)) {
      setMessage(
        "Enter a valid Solana wallet address.",
      );
      return;
    }

    setIsSavingWallet(true);
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

      setCurrentWallet(address);
      setManualWallet(address);

      setMessage("Wallet address saved.");

      router.refresh();
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
      if (
  error instanceof Error &&
  error.message.includes(
    "ACTIVE_WITHDRAWAL_WALLET_LOCKED",
  )
) {
  setMessage(
    "Your wallet cannot be changed while a withdrawal is being processed.",
  );
  return;
}
    } finally {
      setIsSavingWallet(false);
    }
  }

  async function submitWithdrawal() {
    if (areaBalance <= 0) {
      setMessage(
        "There is no AREA available to withdraw.",
      );
      return;
    }

    if (!normalizedWallet) {
      setMessage(
        "Set a wallet address before withdrawing AREA.",
      );
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.rpc(
          "request_area_withdrawal",
        );

      if (error) {
        if (
  error.message.includes(
    "ACTIVE_WITHDRAWAL_EXISTS",
  )
) {
  throw new Error(
    "You already have a withdrawal being processed.",
  );
}
        if (
          error.message.includes(
            "WALLET_REQUIRED",
          )
        ) {
          throw new Error(
            "Set a wallet address before withdrawing AREA.",
          );
        }

        if (
          error.message.includes(
            "WALLET_INVALID",
          )
        ) {
          throw new Error(
            "Your wallet address is invalid.",
          );
        }

        if (
          error.message.includes(
            "NOTHING_TO_WITHDRAW",
          )
        ) {
          throw new Error(
            "There is no AREA available to withdraw.",
          );
        }

        throw new Error(error.message);
      }

      const result =
        data as WithdrawalResult | null;

      if (!result?.success) {
        throw new Error(
          "Withdrawal request could not be created.",
        );
      }

      setShowConfirm(false);

      setMessage(
        `${result.amount ?? areaBalance} AREA withdrawal requested.`,
      );

      router.refresh();
    } catch (error) {
        if (
  error instanceof Error &&
  error.message.includes(
    "ACTIVE_WITHDRAWAL_WALLET_LOCKED",
  )
) {
  setMessage(
    "Your wallet cannot be changed while a withdrawal is being processed.",
  );
  return;
}
      console.error(
        "AREA withdrawal failed:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Withdrawal request failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-[#12151a] p-5">
      <p className="text-[10px] font-black tracking-[0.18em] text-white/30">
        AREA REWARDS
      </p>

      <div className="mt-4">
        <p className="text-xs font-semibold text-white/35">
          Available to Claim
        </p>

        <p className="mt-1 text-3xl font-black text-white">
          {areaBalance.toLocaleString()} AREA
        </p>
      </div>

      <div className="mt-6 border-t border-white/[0.07] pt-5">
        <p className="text-xs font-semibold text-white/35">
          Solana Wallet
        </p>

        <p className="mt-1 text-sm font-semibold text-white/65">
          {normalizedWallet
            ? shortenWallet(
                normalizedWallet,
              )
            : "Not set"}
        </p>
      </div>

      <div className="mt-4">
        <WalletConnectButton
          currentWalletAddress={
            currentWallet
          }
          onWalletSaved={(address) => {
            setCurrentWallet(address);
            setManualWallet(address);
            setMessage(
              "Wallet connected and saved.",
            );
            router.refresh();
          }}
        />
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.07]" />

        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/20">
          or
        </span>

        <div className="h-px flex-1 bg-white/[0.07]" />
      </div>

      <div>
        <label
          htmlFor="manual-wallet"
          className="mb-2 block text-xs font-semibold text-white/35"
        >
          Enter wallet address manually
        </label>

        <input
          id="manual-wallet"
          type="text"
          value={manualWallet}
          onChange={(event) =>
            setManualWallet(
              event.target.value,
            )
          }
          placeholder="Solana wallet address"
          spellCheck={false}
          autoComplete="off"
          className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#48a7ff]/60"
        />

        <button
          type="button"
          disabled={
            isSavingWallet ||
            !manualWallet.trim()
          }
          onClick={() =>
            void saveManualWallet()
          }
          className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/55 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isSavingWallet
            ? "Saving..."
            : "Save Wallet"}
        </button>
      </div>

      <button
        type="button"
        disabled={
          isSubmitting ||
          areaBalance <= 0 ||
          !normalizedWallet
        }
        onClick={() =>
          setShowConfirm(true)
        }
        className="mt-6 w-full rounded-xl bg-[#48a7ff] px-4 py-3 text-sm font-black text-[#07111b] transition hover:bg-[#6bb8ff] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Withdraw{" "}
        {areaBalance.toLocaleString()} AREA
      </button>

      {message && (
        <p className="mt-3 text-xs leading-5 text-white/40">
          {message}
        </p>
      )}

      {showConfirm &&
        normalizedWallet && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12151a] p-6 shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#69b7ff]">
                Confirm Withdrawal
              </p>

              <h2 className="mt-2 text-xl font-black text-white">
                Withdraw{" "}
                {areaBalance.toLocaleString()}{" "}
                AREA
              </h2>

              <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#0b0d10] p-4">
                <p className="text-xs font-semibold text-white/30">
                  Destination
                </p>

                <p className="mt-2 break-all text-sm font-semibold text-white/70">
                  {normalizedWallet}
                </p>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/35">
                AREA transfers cannot be
                reversed. Verify the wallet
                address before continuing.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    setShowConfirm(false)
                  }
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/55 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    void submitWithdrawal()
                  }
                  className="flex-1 rounded-xl bg-[#48a7ff] px-4 py-3 text-sm font-black text-[#07111b] transition hover:bg-[#6bb8ff] disabled:opacity-40"
                >
                  {isSubmitting
                    ? "Requesting..."
                    : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}