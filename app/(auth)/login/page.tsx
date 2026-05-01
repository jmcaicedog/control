"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const next =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next") ?? "/dashboard"
      : "/dashboard";
  const [email, setEmail] = useState("jcaicedev@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? "No fue posible iniciar sesión");
      }

      toast.success("Bienvenido");
      router.replace(next);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[0_26px_85px_rgba(1,8,22,0.58)]">
        <div className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--soft)]/70 p-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Control</p>
          <h1 className="mt-2 text-[30px] font-bold leading-none text-[var(--ink)]">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Accede para gestionar proyectos, tarjetas y finanzas.</p>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Usuario inicial: <span className="text-[var(--ink)]">jcaicedev@gmail.com</span>
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
