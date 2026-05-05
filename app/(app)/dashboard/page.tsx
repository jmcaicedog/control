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

const cardIconButtonClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--soft)] text-[var(--ink)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]";

function IconBoard() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h7v6H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 13h7v6H4z" />
    </svg>
  );
}

function IconAccess() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 8a4 4 0 1 1 7.5 2H23v2h-2v2h-2v2h-2.5l-1.1-1.1a4 4 0 0 1-1.4.1A4 4 0 0 1 14 8Z" />
      <circle cx="17" cy="8" r="1" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h8" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14 5 5 5M4 20l3.5-.5L18 9a1.4 1.4 0 0 0 0-2l-1-1a1.4 1.4 0 0 0-2 0L4.5 16.5 4 20z" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v4H4zM6 10h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8zM10 14h4" />
    </svg>
  );
}

function IconRestore() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a8 8 0 1 0 2.3-5.6M4 5v6h6" />
    </svg>
  );
}

function IconConvert() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h10m0 0-3.5-3.5M14 12l-3.5 3.5M17 5h3v3M20 8l-5 5" />
    </svg>
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

                        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                          <Link href={`/projects/${project.id}/board`} className={cardIconButtonClass} aria-label="Abrir board" title="Abrir board">
                            <IconBoard />
                          </Link>
                          <Link href={`/projects/${project.id}/access`} className={cardIconButtonClass} aria-label="Accesos" title="Accesos">
                            <IconAccess />
                          </Link>
                          <Link href={`/projects/${project.id}/edit`} className={cardIconButtonClass} aria-label="Editar" title="Editar">
                            <IconEdit />
                          </Link>
                          <ConfirmProjectActionButton
                            action={archiveProjectAction.bind(null, project.id)}
                            confirmMessage="¿Seguro que deseas archivar este proyecto? Podrás restaurarlo desde la sección Archivados."
                            label={<IconArchive />}
                            buttonLabel="Archivar"
                            confirmLabel="Sí, archivar"
                            cancelLabel="Mantener"
                            className={cardIconButtonClass}
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

                        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                          <Link
                            href={`/projects/${project.id}/edit?mode=convert`}
                            className={cardIconButtonClass}
                            aria-label="Aprobar y convertir"
                            title="Aprobar y convertir"
                          >
                            <IconConvert />
                          </Link>
                          <Link
                            href={`/projects/${project.id}/edit`}
                            className={cardIconButtonClass}
                            aria-label="Editar cotización"
                            title="Editar cotización"
                          >
                            <IconEdit />
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

                        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                          <Link href={`/projects/${project.id}/access`} className={cardIconButtonClass} aria-label="Accesos" title="Accesos">
                            <IconAccess />
                          </Link>
                          <Link href={`/projects/${project.id}/edit`} className={cardIconButtonClass} aria-label="Editar" title="Editar">
                            <IconEdit />
                          </Link>
                          <ConfirmProjectActionButton
                            action={restoreProjectAction.bind(null, project.id)}
                            confirmMessage="¿Deseas restaurar este proyecto para que vuelva a Proyectos?"
                            label={<IconRestore />}
                            buttonLabel="Restaurar"
                            confirmLabel="Sí, restaurar"
                            cancelLabel="Cancelar"
                            className={cardIconButtonClass}
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
        </>
      )}
    </div>
  );
}
