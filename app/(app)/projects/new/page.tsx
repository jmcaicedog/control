import { ProjectForm } from "@/components/projects/project-form";
import { createProjectAction } from "@/app/(app)/projects/actions";

export default function NewProjectPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Nuevo proyecto</h1>
      <ProjectForm action={createProjectAction} submitLabel="Crear proyecto" />
    </div>
  );
}
