import { createQuoteAction } from "@/app/(app)/projects/actions";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewQuotePage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(1,8,22,0.3)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Cotización</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)]">Nueva cotización</h1>
      </div>
      <ProjectForm action={createQuoteAction} entityLabel="cotizacion" showDates={false} submitLabel="Crear cotización" />
    </div>
  );
}
