import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCOP, formatDate, getProjectDurationLabel, getProjectStatus } from "@/lib/utils";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { deleteProjectAction } from "@/app/(app)/projects/actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const data = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_40px_rgba(3,11,30,0.45)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Panel financiero</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Proyectos de desarrollo</h1>
          <Link
            href="/projects/new"
            className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)]"
          >
            Nuevo proyecto
          </Link>
        </div>
      </section>

      {data.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Aún no tienes proyectos</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Crea tu primer proyecto para gestionar costos, tareas y cobros.</p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((project) => {
            const total = Number(project.totalValue);
            const advance = Number(project.advanceValue);
            const balance = Math.max(total - advance, 0);
            const status = getProjectStatus(project.startDate, project.endDate);

            return (
              <article
                key={project.id}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_32px_rgba(1,8,22,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(1,8,22,0.45)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--ink)]">{project.name}</h3>
                    <p className="text-sm text-[var(--muted)]">Cliente: {project.clientName}</p>
                  </div>
                  <span className="rounded-full border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">
                    {status}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <p className="flex justify-between"><span className="text-[var(--muted)]">Valor total</span><strong className="font-semibold">{formatCOP(total)}</strong></p>
                  <p className="flex justify-between"><span className="text-[var(--muted)]">Anticipo</span><strong className="font-semibold">{formatCOP(advance)}</strong></p>
                  <p className="flex justify-between"><span className="text-[var(--muted)]">Saldo por cobrar</span><strong className="font-semibold text-[var(--brand)]">{formatCOP(balance)}</strong></p>
                </div>

                <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--soft)] p-3 text-xs text-[var(--muted)]">
                  <p>Inicio: {formatDate(project.startDate)}</p>
                  <p>Fin: {formatDate(project.endDate)}</p>
                  <p>Duración: {getProjectDurationLabel(project.startDate, project.endDate)}</p>
                </div>

                {project.clientEmail || project.clientPhone ? (
                  <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                    {project.clientEmail ? <p>Correo: {project.clientEmail}</p> : null}
                    {project.clientPhone ? <p>Tel: {project.clientPhone}</p> : null}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/projects/${project.id}/board`}
                    className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    Abrir board
                  </Link>
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    Editar
                  </Link>
                  <DeleteProjectButton action={deleteProjectAction.bind(null, project.id)} />
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
