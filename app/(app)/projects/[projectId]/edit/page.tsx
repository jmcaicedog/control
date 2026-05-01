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
      <h1 className="text-2xl font-bold tracking-tight">Editar proyecto</h1>
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
