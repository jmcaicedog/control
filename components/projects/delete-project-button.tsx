"use client";

type DeleteProjectButtonProps = {
  action: () => Promise<void>;
};

export function DeleteProjectButton({ action }: DeleteProjectButtonProps) {
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = window.confirm("¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.");
        if (!ok) {
          return;
        }
        await action();
      }}
      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
    >
      Eliminar
    </button>
  );
}
