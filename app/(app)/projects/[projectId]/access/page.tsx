import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProjectAccessPanel } from "@/components/projects/project-access-panel";
import { db } from "@/db";
import { projectCredentials, projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Params = Promise<{ projectId: string }>;

export default async function ProjectAccessPage({ params }: { params: Params }) {
  const { projectId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: projects.clientName,
      type: projects.type,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project || project.type !== "project") {
    notFound();
  }

  const credentials = await db
    .select({
      id: projectCredentials.id,
      name: projectCredentials.name,
      url: projectCredentials.url,
      username: projectCredentials.username,
      password: projectCredentials.password,
      comments: projectCredentials.comments,
    })
    .from(projectCredentials)
    .where(eq(projectCredentials.projectId, project.id))
    .orderBy(desc(projectCredentials.createdAt));

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_30px_rgba(1,8,22,0.3)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Accesos</p>
          <h1 className="truncate text-2xl font-bold tracking-tight text-[var(--ink)]">{project.name}</h1>
          <p className="text-sm text-[var(--muted)]">Cliente: {project.clientName}</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <Link
            href={`/projects/${project.id}/board`}
            className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-center text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] sm:flex-none"
          >
            Ver Kanban
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-center text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] sm:flex-none"
          >
            Volver
          </Link>
        </div>
      </div>

      <ProjectAccessPanel projectId={project.id} initialCredentials={credentials} />
    </div>
  );
}
