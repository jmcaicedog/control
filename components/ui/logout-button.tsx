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
      className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold hover:bg-[var(--soft)]"
    >
      Cerrar sesión
    </button>
  );
}
