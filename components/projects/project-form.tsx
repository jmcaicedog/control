import Link from "next/link";

type ProjectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  entityLabel?: "proyecto" | "cotizacion";
  showDates?: boolean;
  initialData?: {
    name?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    description?: string;
    totalValue?: string | number;
    advanceValue?: string | number;
    startDate?: string;
    endDate?: string;
  };
  submitLabel: string;
  cancelHref?: string;
};

export function ProjectForm({
  action,
  entityLabel = "proyecto",
  showDates = true,
  initialData,
  submitLabel,
  cancelHref = "/dashboard",
}: ProjectFormProps) {
  const mainLabel = entityLabel === "cotizacion" ? "cotización" : "proyecto";

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_36px_rgba(1,8,22,0.35)] sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="name">
            Nombre del {mainLabel} *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={initialData?.name ?? ""}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="clientName">
            Nombre del cliente *
          </label>
          <input
            id="clientName"
            name="clientName"
            required
            defaultValue={initialData?.clientName ?? ""}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="clientEmail">
            Correo de contacto
          </label>
          <input
            id="clientEmail"
            type="email"
            name="clientEmail"
            defaultValue={initialData?.clientEmail ?? ""}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="clientPhone">
            Teléfono de contacto
          </label>
          <input
            id="clientPhone"
            name="clientPhone"
            defaultValue={initialData?.clientPhone ?? ""}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="description">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ""}
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="totalValue">
            Valor total pactado (COP)
          </label>
          <input
            id="totalValue"
            name="totalValue"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={initialData?.totalValue ?? "0"}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="advanceValue">
            Anticipo (COP)
          </label>
          <input
            id="advanceValue"
            name="advanceValue"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={initialData?.advanceValue ?? "0"}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>

      {showDates ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="startDate">
              Fecha de inicio
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={initialData?.startDate ?? ""}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--brand)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]" htmlFor="endDate">
              Fecha de finalización
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              defaultValue={initialData?.endDate ?? ""}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--brand)]"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)]"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
