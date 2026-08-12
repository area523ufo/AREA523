"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  signIn,
  signInWithGoogle,
  signUp,
} from "@/lib/supabase/auth";

export type MockUser = {
  username: string;
  email: string;
};

type AuthMode =
  | "login"
  | "signup";

type AuthModalProps = {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onAuthenticated: (
    user: MockUser,
  ) => void;
};

export default function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [
    mode,
    setMode,
  ] = useState<AuthMode>(
    initialMode,
  );

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMode(
      initialMode,
    );

    setFormError("");
  }, [
    initialMode,
    isOpen,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style
        .overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [
    isOpen,
    onClose,
  ]);

  if (!isOpen) {
    return null;
  }

  const resetFields =
    () => {
      setUsername("");
      setEmail("");
      setPassword("");
      setFormError("");
    };

  const switchMode = (
    nextMode: AuthMode,
  ) => {
    setMode(nextMode);
    resetFields();
  };

  const handleGoogleLogin =
    async () => {
      if (
        isSubmitting
      ) {
        return;
      }

      setFormError("");
      setIsSubmitting(true);

      try {
        const {
          error,
        } =
          await signInWithGoogle();

        if (error) {
          setFormError(
            error.message,
          );

          setIsSubmitting(
            false,
          );

          return;
        }

        /*
         * Successful OAuth starts
         * an external redirect.
         */
      } catch (error) {
        console.error(
          "Google login failed:",
          error,
        );

        setFormError(
          "Google login could not be started.",
        );

        setIsSubmitting(
          false,
        );
      }
    };

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setFormError("");

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      const normalizedUsername =
        username.trim() ||
        normalizedEmail
          .split("@")[0] ||
        "area523_user";

      if (
        !normalizedEmail.includes(
          "@",
        )
      ) {
        setFormError(
          "Enter a valid email address.",
        );

        return;
      }

      if (
        mode ===
        "signup"
      ) {
        if (
          normalizedUsername
            .length < 3
        ) {
          setFormError(
            "Username must contain at least 3 characters.",
          );

          return;
        }

        if (
          !/^[a-zA-Z0-9_]+$/.test(
            normalizedUsername,
          )
        ) {
          setFormError(
            "Username may only contain letters, numbers, and underscores.",
          );

          return;
        }
      }

      if (
        password.length <
        6
      ) {
        setFormError(
          "Password must contain at least 6 characters.",
        );

        return;
      }

      setIsSubmitting(
        true,
      );

      try {
        if (
          mode ===
          "signup"
        ) {
          const {
            error,
          } =
            await signUp(
              normalizedEmail,
              password,
              normalizedUsername,
            );

          if (error) {
            setFormError(
              error.message,
            );

            setIsSubmitting(
              false,
            );

            return;
          }

          alert(
            "Account created successfully.",
          );

          setIsSubmitting(
            false,
          );

          resetFields();

          setMode(
            "login",
          );

          return;
        }

        const {
          data,
          error,
        } =
          await signIn(
            normalizedEmail,
            password,
          );

        if (error) {
          setFormError(
            error.message,
          );

          setIsSubmitting(
            false,
          );

          return;
        }

        onAuthenticated({
          username:
            data.user
              .user_metadata
              .username ??
            normalizedUsername,

          email:
            data.user
              .email ??
            normalizedEmail,
        });

        setIsSubmitting(
          false,
        );

        resetFields();

        onClose();
      } catch (error) {
        console.error(
          "Authentication failed:",
          error,
        );

        setFormError(
          "Unexpected error.",
        );

        setIsSubmitting(
          false,
        );
      }
    };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#12151a] shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-[#75bdff]">
              AREA523 ACCOUNT
            </p>

            <h2
              id="auth-modal-title"
              className="mt-2 text-2xl font-black text-white"
            >
              {mode ===
              "login"
                ? "Log in"
                : "Create account"}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close authentication window"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 border-b border-white/10">
          <button
            type="button"
            onClick={() =>
              switchMode(
                "login",
              )
            }
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              mode ===
              "login"
                ? "border-[#48a7ff] bg-[#48a7ff]/5 text-[#75bdff]"
                : "border-transparent text-white/35 hover:text-white/70"
            }`}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() =>
              switchMode(
                "signup",
              )
            }
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              mode ===
              "signup"
                ? "border-[#48a7ff] bg-[#48a7ff]/5 text-[#75bdff]"
                : "border-transparent text-white/35 hover:text-white/70"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5 p-6"
        >
          {/* GOOGLE */}
          <button
            type="button"
            disabled={
              isSubmitting
            }
            onClick={() =>
              void handleGoogleLogin()
            }
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-[#111827] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 shrink-0"
            >
              <path
                fill="#4285F4"
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.39a4.61 4.61 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.97-4.33 2.97-7.38Z"
              />

              <path
                fill="#34A853"
                d="M12 22c2.7 0 4.97-.9 6.63-2.39l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z"
              />

              <path
                fill="#FBBC05"
                d="M6.39 13.93A6.03 6.03 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.48H3.04A10 10 0 0 0 2 12c0 1.61.38 3.13 1.04 4.52l3.35-2.59Z"
              />

              <path
                fill="#EA4335"
                d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.95 14.7 2 12 2a10 10 0 0 0-8.96 5.48l3.35 2.59C7.18 7.7 9.39 5.94 12 5.94Z"
              />
            </svg>

            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />

            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/25">
              or
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* USERNAME */}
          {mode ===
            "signup" && (
            <div>
              <label
                htmlFor="auth-username"
                className="mb-2 block text-sm font-bold text-white/70"
              >
                Username
              </label>

              <div className="flex items-center rounded-xl border border-white/10 bg-[#0b0d10] focus-within:border-[#48a7ff]/60">
                <span className="pl-4 text-sm text-white/25">
                  u/
                </span>

                <input
                  id="auth-username"
                  type="text"
                  value={
                    username
                  }
                  onChange={(
                    event,
                  ) =>
                    setUsername(
                      event
                        .target
                        .value,
                    )
                  }
                  autoComplete="username"
                  placeholder="area523_user"
                  className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/20"
                />
              </div>
            </div>
          )}

          {/* EMAIL */}
          <div>
            <label
              htmlFor="auth-email"
              className="mb-2 block text-sm font-bold text-white/70"
            >
              Email
            </label>

            <input
              id="auth-email"
              type="email"
              value={
                email
              }
              onChange={(
                event,
              ) =>
                setEmail(
                  event
                    .target
                    .value,
                )
              }
              autoComplete="email"
              placeholder="name@example.com"
              required
              className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#48a7ff]/60"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="auth-password"
              className="mb-2 block text-sm font-bold text-white/70"
            >
              Password
            </label>

            <input
              id="auth-password"
              type="password"
              value={
                password
              }
              onChange={(
                event,
              ) =>
                setPassword(
                  event
                    .target
                    .value,
                )
              }
              autoComplete={
                mode ===
                "login"
                  ? "current-password"
                  : "new-password"
              }
              placeholder="At least 6 characters"
              required
              className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#48a7ff]/60"
            />
          </div>

          {/* ERROR */}
          {formError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
              <p className="text-sm font-semibold text-red-300">
                {formError}
              </p>
            </div>
          )}

          {/* EMAIL SUBMIT */}
          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="w-full rounded-full bg-[#48a7ff] px-6 py-3 text-sm font-black text-[#06111c] transition hover:bg-[#71baff] disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting
              ? mode ===
                "login"
                ? "Logging in..."
                : "Creating account..."
              : mode ===
                  "login"
                ? "Log In"
                : "Create Account"}
          </button>

          <p className="text-center text-xs leading-5 text-white/30">
            By continuing, you agree to AREA523&apos;s
            Terms and Privacy Policy.
          </p>
        </form>
      </section>
    </div>
  );
}