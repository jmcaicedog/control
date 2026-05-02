"use client";

import { useEffect, useRef, useState } from "react";

type ConfirmProjectActionButtonProps = {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  className: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
};

export function ConfirmProjectActionButton({
  action,
  confirmMessage,
  label,
  className,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmClassName = "rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-[#061425] transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60",
}: ConfirmProjectActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    confirmButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, isSubmitting]);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await action();
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {label}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar acción"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) {
              setIsOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgba(1,8,22,0.6)]">
            <p className="text-sm leading-relaxed text-[var(--ink)]">{confirmMessage}</p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={confirmClassName}
              >
                {isSubmitting ? "Procesando..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
