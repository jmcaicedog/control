"use client";

import { ConfirmProjectActionButton } from "@/components/projects/confirm-project-action-button";

type DeleteProjectButtonProps = {
  action: () => Promise<void>;
};

export function DeleteProjectButton({ action }: DeleteProjectButtonProps) {
  return (
    <ConfirmProjectActionButton
      action={action}
      confirmMessage="¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer."
      label={
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6m-9 4h12m-1 0-.7 11.2A2 2 0 0 1 14.3 20H9.7a2 2 0 0 1-2-1.8L7 7m3 4v5m4-5v5" />
        </svg>
      }
      buttonLabel="Eliminar"
      confirmLabel="Sí, eliminar"
      cancelLabel="Cancelar"
      confirmClassName="inline-flex items-center justify-center rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--soft)] text-[var(--ink)] transition duration-200 hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--brand)_40%,transparent)] disabled:opacity-60"
    />
  );
}
