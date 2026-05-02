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
      label="Eliminar"
      confirmLabel="Sí, eliminar"
      cancelLabel="Cancelar"
      confirmClassName="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
      className="rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-60"
    />
  );
}
