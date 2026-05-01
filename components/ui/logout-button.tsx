"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
    >
      Cerrar sesión
    </button>
  );
}
