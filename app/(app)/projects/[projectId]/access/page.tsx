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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(1,8,22,0.3)]">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Accesos</p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">{project.name}</h1>
          <p className="text-sm text-[var(--muted)]">Cliente: {project.clientName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${project.id}/board`}
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            Ver Kanban
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            Volver
          </Link>
        </div>
      </div>

      <ProjectAccessPanel projectId={project.id} initialCredentials={credentials} />
    </div>
  );
}
