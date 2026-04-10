"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CosmicBackground from "@/components/CosmicBackground";

type Tab = "login" | "register";

export default function AuthPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("login");
  const [checking, setChecking] = useState(true);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0); // countdown seconds

  // Countdown timer for rate limit
  useEffect(() => {
    if (retryAfter <= 0) return;
    const t = setTimeout(() => setRetryAfter((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [retryAfter]);

  // Check auth status on mount
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.isAuthenticated) {
          router.push("/canvas");
          return;
        }
        // No account yet → default to register tab
        if (!data.hasAccount) setTab("register");
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });

    if (res.status === 429) {
      const retry = Number(res.headers.get("Retry-After") ?? 60);
      setRetryAfter(retry);
      setError(`Too many attempts. Try again in ${retry}s.`);
      setLoading(false);
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push("/canvas");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (regPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (regPassword !== regConfirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail, password: regPassword, name: regName }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    // Auto-login after register
    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail, password: regPassword }),
    });

    if (!loginRes.ok) {
      setError("Account created. Please log in.");
      setTab("login");
      setLoginEmail(regEmail);
      setLoading(false);
      return;
    }

    router.push("/canvas");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CosmicBackground />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-stone-500 text-sm tracking-widest"
        >
          ...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <CosmicBackground />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <div className="bg-[#1a1917]/85 backdrop-blur-xl border border-stone-500/20 rounded-2xl shadow-2xl shadow-stone-950/50 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-stone-300 to-amber-200 bg-clip-text text-transparent font-[family-name:var(--font-playfair)]">
              nulis
            </h1>
            <p className="text-stone-500 text-xs mt-1 tracking-wide">
              your personal writing space
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mx-8 mt-2 mb-6 bg-[#111110] rounded-xl p-1 gap-1">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize cursor-pointer ${
                  tab === t
                    ? "bg-stone-700 text-stone-100 shadow"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">

              {/* ── Login ── */}
              {tab === "login" && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-3"
                >
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Email"
                    required
                    autoFocus
                    className="w-full px-4 py-3 bg-[#292524]/60 border border-stone-600/20 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 focus:ring-1 focus:ring-stone-500/20 transition-all text-sm"
                  />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-4 py-3 bg-[#292524]/60 border border-stone-600/20 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 focus:ring-1 focus:ring-stone-500/20 transition-all text-sm"
                  />

                  <ErrorMessage error={error} />

                  <button
                    type="submit"
                    disabled={loading || !loginEmail || !loginPassword || retryAfter > 0}
                    className="w-full mt-1 py-3 bg-stone-700 hover:bg-stone-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors cursor-pointer"
                  >
                    {loading ? "Signing in..." : retryAfter > 0 ? `Try again in ${retryAfter}s` : "Sign In"}
                  </button>
                </motion.form>
              )}

              {/* ── Register ── */}
              {tab === "register" && (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your name"
                    required
                    autoFocus
                    className="w-full px-4 py-3 bg-[#292524]/60 border border-stone-600/20 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 focus:ring-1 focus:ring-stone-500/20 transition-all text-sm"
                  />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full px-4 py-3 bg-[#292524]/60 border border-stone-600/20 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 focus:ring-1 focus:ring-stone-500/20 transition-all text-sm"
                  />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password (min. 8 characters)"
                    required
                    className="w-full px-4 py-3 bg-[#292524]/60 border border-stone-600/20 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 focus:ring-1 focus:ring-stone-500/20 transition-all text-sm"
                  />
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className="w-full px-4 py-3 bg-[#292524]/60 border border-stone-600/20 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 focus:ring-1 focus:ring-stone-500/20 transition-all text-sm"
                  />

                  <ErrorMessage error={error} />

                  <button
                    type="submit"
                    disabled={loading || !regName || !regEmail || !regPassword || !regConfirm}
                    className="w-full mt-1 py-3 bg-stone-700 hover:bg-stone-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors cursor-pointer"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-red-400 text-xs px-1"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
