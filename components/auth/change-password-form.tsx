"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? "No fue posible cambiar la contraseña");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Contraseña actualizada correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_36px_rgba(1,8,22,0.35)] sm:p-6"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="currentPassword">
          Contraseña actual
        </label>
        <input
          id="currentPassword"
          type="password"
          minLength={8}
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="newPassword">
          Nueva contraseña
        </label>
        <input
          id="newPassword"
          type="password"
          minLength={12}
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="confirmPassword">
          Confirmar nueva contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          minLength={12}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
        />
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--soft)] p-3 text-xs text-[var(--muted)]">
        <p>Requisitos: 12+ caracteres, una mayúscula, una minúscula, un número y un carácter especial.</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] disabled:opacity-50"
      >
        {isPending ? "Actualizando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
