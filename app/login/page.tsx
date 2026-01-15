"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string>("");

  const canSubmit = email.length > 0 && password.length > 0 && status !== "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const endpoint = mode === "register" ? "/api/register" : "/api/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as {
        message?: string;
        needsEmailConfirmation?: boolean;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "Login fehlgeschlagen.");
        return;
      }

      setStatus("success");
      setMessage(
        data.message ??
          (mode === "register"
            ? "Registrierung erfolgreich."
            : "Erfolgreich angemeldet."),
      );
      if (!data.needsEmailConfirmation) {
        router.push("/app");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Netzwerkfehler. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-10 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Zugang
          </p>
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            {mode === "register" ? "Konto erstellen" : "Willkommen zurück"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {mode === "register"
              ? "Lege deine Zugangsdaten fest, um dein Konto zu erstellen."
              : "Bitte melde dich mit deinen Zugangsdaten an, um fortzufahren."}
          </p>
        </div>
        <div className="mt-6 inline-flex rounded-full bg-zinc-100 p-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
              setStatus("idle");
            }}
            className={`rounded-full px-4 py-2 transition ${
              mode === "login"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setMessage("");
              setStatus("idle");
            }}
            className={`rounded-full px-4 py-2 transition ${
              mode === "register"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            Registrieren
          </button>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            E-Mail-Adresse
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
              placeholder="name@firma.de"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Passwort
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
              placeholder="••••••••"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
            />
          </label>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-base font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {status === "loading"
              ? mode === "register"
                ? "Registrieren ..."
                : "Anmelden ..."
              : mode === "register"
                ? "Registrieren"
                : "Anmelden"}
          </button>
          {message ? (
            <p
              className={`rounded-2xl px-4 py-3 text-sm ${
                status === "success"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
              }`}
            >
              {message}
            </p>
          ) : null}
        </form>
        <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link className="font-medium text-zinc-900 dark:text-zinc-100" href="/">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
