import Link from "next/link";

type ProjectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
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

export function ProjectForm({ action, initialData, submitLabel, cancelHref = "/dashboard" }: ProjectFormProps) {
  return (
    <form action={action} className="space-y-5 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="name">
            Nombre del proyecto *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={initialData?.name ?? ""}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="clientName">
            Nombre del cliente *
          </label>
          <input
            id="clientName"
            name="clientName"
            required
            defaultValue={initialData?.clientName ?? ""}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="clientEmail">
            Correo de contacto
          </label>
          <input
            id="clientEmail"
            type="email"
            name="clientEmail"
            defaultValue={initialData?.clientEmail ?? ""}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="clientPhone">
            Teléfono de contacto
          </label>
          <input
            id="clientPhone"
            name="clientPhone"
            defaultValue={initialData?.clientPhone ?? ""}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="description">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ""}
          className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="totalValue">
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
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="advanceValue">
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
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="startDate">
            Fecha de inicio
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={initialData?.startDate ?? ""}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="endDate">
            Fecha de finalización
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={initialData?.endDate ?? ""}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          {submitLabel}
        </button>
        <Link href={cancelHref} className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
