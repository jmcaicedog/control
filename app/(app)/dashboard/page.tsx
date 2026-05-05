import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatCOP, formatDate, getProjectDurationLabel, getProjectStatus } from "@/lib/utils";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ConfirmProjectActionButton } from "@/components/projects/confirm-project-action-button";
import { archiveProjectAction, deleteProjectAction, restoreProjectAction } from "@/app/(app)/projects/actions";

type DashboardTab = "projects" | "quotes" | "archived";
type SearchParams = Promise<{ tab?: string }>;

function getWhatsappUrl(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "");

  if (!normalizedPhone) {
    return null;
  }

  return `https://wa.me/${normalizedPhone}`;
}

function ContactInfo({ email, phone }: { email?: string | null; phone?: string | null }) {
  const whatsappUrl = phone ? getWhatsappUrl(phone) : null;

  if (!email && !phone) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2 text-xs text-[var(--muted)]">
      {email ? (
        <p>
          Correo:{" "}
          <a href={`mailto:${email}`} className="font-medium text-[var(--brand)] underline-offset-2 hover:underline">
            {email}
          </a>
        </p>
      ) : null}

      {phone ? (
        <div>
          <span className="mr-2">Tel:</span>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-[var(--line)] px-2.5 py-1 font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              WhatsApp: {phone}
            </a>
          ) : (
            <span>{phone}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  const currentSearchParams = await searchParams;

  if (!user) {
    return null;
  }

  const data = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt));

  const projectItems = data.filter((item) => item.type === "project" && !item.isArchived);
  const archivedItems = data.filter((item) => item.type === "project" && item.isArchived);
  const quoteItems = data.filter((item) => item.type === "quote");
  const hasAnyItems = data.length > 0;

  const requestedTab = currentSearchParams.tab;
  const validTabs: DashboardTab[] = ["projects", "quotes", "archived"];
  const activeTab: DashboardTab = validTabs.includes(requestedTab as DashboardTab)
    ? (requestedTab as DashboardTab)
    : "projects";

  const tabs = [
    { id: "projects" as const, label: "Proyectos", count: projectItems.length },
    { id: "quotes" as const, label: "Cotizaciones", count: quoteItems.length },
    { id: "archived" as const, label: "Archivados", count: archivedItems.length },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_14px_40px_rgba(3,11,30,0.45)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Panel financiero</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Proyectos y cotizaciones</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/quotes/new"
              className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              Nueva cotización
            </Link>
            <Link
              href="/projects/new"
              className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)]"
            >
              Nuevo proyecto
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_30px_rgba(1,8,22,0.3)]">
        <nav aria-label="Secciones del panel" className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={`/dashboard?tab=${tab.id}`}
                className={
                  isActive
                    ? "rounded-lg border border-[var(--brand)] bg-[var(--brand)]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)]"
                    : "rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                }
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label} ({tab.count})
              </Link>
            );
          })}
        </nav>
      </section>

      {!hasAnyItems ? (
        <section className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Aún no tienes proyectos ni cotizaciones</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Crea una cotización y conviértela en proyecto cuando sea aprobada.</p>
        </section>
      ) : (
        <>
          {activeTab === "projects" ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Proyectos</h2>
                <span className="text-xs text-[var(--muted)]">{projectItems.length}</span>
              </div>

              {projectItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                  No hay proyectos activos todavía.
                </div>
              ) : (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projectItems.map((project) => {
                    const total = Number(project.totalValue);
                    const advance = Number(project.advanceValue);
                    const balance = Math.max(total - advance, 0);
                    const status =
                      project.startDate && project.endDate
                        ? getProjectStatus(project.startDate, project.endDate)
                        : "Sin fechas";

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
                          <p>Inicio: {project.startDate ? formatDate(project.startDate) : "Pendiente"}</p>
                          <p>Fin: {project.endDate ? formatDate(project.endDate) : "Pendiente"}</p>
                          <p>
                            Duración: {project.startDate && project.endDate ? getProjectDurationLabel(project.startDate, project.endDate) : "Pendiente"}
                          </p>
                        </div>

                        <ContactInfo email={project.clientEmail} phone={project.clientPhone} />

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
                          <ConfirmProjectActionButton
                            action={archiveProjectAction.bind(null, project.id)}
                            confirmMessage="¿Seguro que deseas archivar este proyecto? Podrás restaurarlo desde la sección Archivados."
                            label="Archivar"
                            confirmLabel="Sí, archivar"
                            cancelLabel="Mantener"
                            className="rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20"
                          />
                          <DeleteProjectButton action={deleteProjectAction.bind(null, project.id)} />
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </section>
          ) : null}

          {activeTab === "quotes" ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Cotizaciones</h2>
                <span className="text-xs text-[var(--muted)]">{quoteItems.length}</span>
              </div>

              {quoteItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                  No hay cotizaciones registradas.
                </div>
              ) : (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {quoteItems.map((project) => {
                    const total = Number(project.totalValue);
                    const advance = Number(project.advanceValue);
                    const balance = Math.max(total - advance, 0);

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
                            Cotización
                          </span>
                        </div>

                        <div className="mt-4 space-y-1 text-sm">
                          <p className="flex justify-between"><span className="text-[var(--muted)]">Valor cotizado</span><strong className="font-semibold">{formatCOP(total)}</strong></p>
                          <p className="flex justify-between"><span className="text-[var(--muted)]">Anticipo propuesto</span><strong className="font-semibold">{formatCOP(advance)}</strong></p>
                          <p className="flex justify-between"><span className="text-[var(--muted)]">Saldo estimado</span><strong className="font-semibold text-[var(--brand)]">{formatCOP(balance)}</strong></p>
                        </div>

                        <ContactInfo email={project.clientEmail} phone={project.clientPhone} />

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Link
                            href={`/projects/${project.id}/edit`}
                            className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                          >
                            Editar cotización
                          </Link>
                          <Link
                            href={`/projects/${project.id}/edit?mode=convert`}
                            className="rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)]"
                          >
                            Aprobar y convertir
                          </Link>
                          <DeleteProjectButton action={deleteProjectAction.bind(null, project.id)} />
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </section>
          ) : null}

          {activeTab === "archived" ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Archivados</h2>
                <span className="text-xs text-[var(--muted)]">{archivedItems.length}</span>
              </div>

              {archivedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                  No hay proyectos archivados.
                </div>
              ) : (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {archivedItems.map((project) => {
                    const total = Number(project.totalValue);
                    const advance = Number(project.advanceValue);
                    const balance = Math.max(total - advance, 0);

                    return (
                      <article
                        key={project.id}
                        className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 opacity-90 shadow-[0_12px_32px_rgba(1,8,22,0.35)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-[var(--ink)]">{project.name}</h3>
                            <p className="text-sm text-[var(--muted)]">Cliente: {project.clientName}</p>
                          </div>
                          <span className="rounded-full border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Archivado
                          </span>
                        </div>

                        <div className="mt-4 space-y-1 text-sm">
                          <p className="flex justify-between"><span className="text-[var(--muted)]">Valor total</span><strong className="font-semibold">{formatCOP(total)}</strong></p>
                          <p className="flex justify-between"><span className="text-[var(--muted)]">Anticipo</span><strong className="font-semibold">{formatCOP(advance)}</strong></p>
                          <p className="flex justify-between"><span className="text-[var(--muted)]">Saldo por cobrar</span><strong className="font-semibold text-[var(--brand)]">{formatCOP(balance)}</strong></p>
                        </div>

                        <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--soft)] p-3 text-xs text-[var(--muted)]">
                          <p>Inicio: {project.startDate ? formatDate(project.startDate) : "Pendiente"}</p>
                          <p>Fin: {project.endDate ? formatDate(project.endDate) : "Pendiente"}</p>
                          <p>
                            Duración: {project.startDate && project.endDate ? getProjectDurationLabel(project.startDate, project.endDate) : "Pendiente"}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <ConfirmProjectActionButton
                            action={restoreProjectAction.bind(null, project.id)}
                            confirmMessage="¿Deseas restaurar este proyecto para que vuelva a Proyectos?"
                            label="Restaurar"
                            confirmLabel="Sí, restaurar"
                            cancelLabel="Cancelar"
                            className="rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)]"
                          />
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
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
