import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProjectAction } from "@/app/(app)/projects/actions";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Params = Promise<{ projectId: string }>;

export default async function EditProjectPage({ params }: { params: Params }) {
  const { projectId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(1,8,22,0.3)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Proyecto</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)]">Editar proyecto</h1>
      </div>
      <ProjectForm
        action={updateProjectAction.bind(null, projectId)}
        submitLabel="Guardar cambios"
        initialData={{
          name: project.name,
          clientName: project.clientName,
          clientEmail: project.clientEmail ?? "",
          clientPhone: project.clientPhone ?? "",
          description: project.description,
          totalValue: String(project.totalValue),
          advanceValue: String(project.advanceValue),
          startDate: project.startDate,
          endDate: project.endDate,
        }}
      />
    </div>
  );
}
