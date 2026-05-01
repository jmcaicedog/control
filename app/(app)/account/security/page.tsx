import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SecurityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(1,8,22,0.3)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Seguridad</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)]">Cambiar contraseña</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Usuario actual: <span className="text-[var(--ink)]">{user.email}</span>
        </p>
      </section>

      <ChangePasswordForm />
    </div>
  );
}
