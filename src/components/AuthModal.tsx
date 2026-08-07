"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { signIn, signUp } from "@/lib/supabase/auth";

export type MockUser = {
  username: string;
  email: string;
};

type AuthMode = "login" | "signup";

type AuthModalProps = {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onAuthenticated: (user: MockUser) => void;
};

export default function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] =
    useState<AuthMode>(initialMode);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMode(initialMode);
    setFormError("");
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const resetFields = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setFormError("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetFields();
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const normalizedUsername =
      username.trim() ||
      normalizedEmail.split("@")[0] ||
      "area523_user";

    if (!normalizedEmail.includes("@")) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (mode === "signup") {
      if (normalizedUsername.length < 3) {
        setFormError(
          "Username must contain at least 3 characters.",
        );
        return;
      }

      if (
        !/^[a-zA-Z0-9_]+$/.test(normalizedUsername)
      ) {
        setFormError(
          "Username may only contain letters, numbers, and underscores.",
        );
        return;
      }
    }

    if (password.length < 6) {
      setFormError(
        "Password must contain at least 6 characters.",
      );
      return;
    }

    setIsSubmitting(true);

try {
  if (mode === "signup") {
    const { error } = await signUp(
      normalizedEmail,
      password,
      normalizedUsername
    );

    if (error) {
      setFormError(error.message);
      setIsSubmitting(false);
      return;
    }

    alert("Account created successfully.");

    setIsSubmitting(false);
    resetFields();
    setMode("login");

    return;
  }

  const { data, error } = await signIn(
    normalizedEmail,
    password
  );

  if (error) {
    setFormError(error.message);
    setIsSubmitting(false);
    return;
  }

  onAuthenticated({
    username:
      data.user.user_metadata.username ??
      normalizedUsername,
    email: data.user.email ?? normalizedEmail,
  });

  setIsSubmitting(false);
  resetFields();
  onClose();
} catch {
  setFormError("Unexpected error.");
  setIsSubmitting(false);
}
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
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
              {mode === "login"
                ? "Log in"
                : "Create account"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication window"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              mode === "login"
                ? "border-[#48a7ff] bg-[#48a7ff]/5 text-[#75bdff]"
                : "border-transparent text-white/35 hover:text-white/70"
            }`}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              mode === "signup"
                ? "border-[#48a7ff] bg-[#48a7ff]/5 text-[#75bdff]"
                : "border-transparent text-white/35 hover:text-white/70"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {mode === "signup" && (
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
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  autoComplete="username"
                  placeholder="area523_user"
                  className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/20"
                />
              </div>
            </div>
          )}

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
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              placeholder="name@example.com"
              required
              className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#48a7ff]/60"
            />
          </div>

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
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              placeholder="At least 6 characters"
              required
              className="w-full rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#48a7ff]/60"
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
              <p className="text-sm font-semibold text-red-300">
                {formError}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#48a7ff] px-6 py-3 text-sm font-black text-[#06111c] transition hover:bg-[#71baff] disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </button>

          <p className="text-center text-xs leading-5 text-white/30">
            This is currently a local authentication
            prototype. Real passwords are not stored or
            transmitted.
          </p>
        </form>
      </section>
    </div>
  );
}