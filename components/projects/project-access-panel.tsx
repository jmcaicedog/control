"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createProjectCredentialAction,
  deleteProjectCredentialAction,
  updateProjectCredentialAction,
} from "@/app/(app)/projects/[projectId]/access/actions";

type Credential = {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  comments: string;
};

type ProjectAccessPanelProps = {
  projectId: string;
  initialCredentials: Credential[];
};

type FormState = {
  name: string;
  url: string;
  username: string;
  password: string;
  comments: string;
};

const emptyForm: FormState = {
  name: "",
  url: "",
  username: "",
  password: "",
  comments: "",
};

const credentialIconButtonBaseClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md border transition sm:h-8 sm:w-8";
const credentialEditButtonClass =
  `${credentialIconButtonBaseClass} border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]`;
const credentialCopyButtonClass =
  `${credentialIconButtonBaseClass} border-sky-300/40 text-sky-200 hover:border-sky-200 hover:text-sky-100`;
const credentialToggleButtonClass =
  `${credentialIconButtonBaseClass} border-violet-300/40 text-violet-200 hover:border-violet-200 hover:text-violet-100`;
const credentialDeleteButtonClass =
  `${credentialIconButtonBaseClass} border-red-400/40 text-red-200 hover:border-red-300 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60`;

export function ProjectAccessPanel({ projectId, initialCredentials }: ProjectAccessPanelProps) {
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<string, boolean>>({});
  const [activeCopyRow, setActiveCopyRow] = useState<string | null>(null);
  const [credentialPendingDelete, setCredentialPendingDelete] = useState<Credential | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isPending, startTransition] = useTransition();

  const selectedCredential = useMemo(
    () => credentials.find((item) => item.id === editingId) ?? null,
    [credentials, editingId]
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetToCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (credential: Credential) => {
    setMode("edit");
    setEditingId(credential.id);
    setForm({
      name: credential.name,
      url: credential.url,
      username: credential.username,
      password: credential.password,
      comments: credential.comments,
    });
  };

  const handleSubmit = () => {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createProjectCredentialAction({
            projectId,
            name: form.name,
            url: form.url,
            username: form.username,
            password: form.password,
            comments: form.comments,
          });

          setCredentials((prev) => [created, ...prev]);
          setForm(emptyForm);
          toast.success("Credencial creada");
          return;
        }

        if (!editingId) {
          toast.error("No hay una credencial seleccionada para editar");
          return;
        }

        const updated = await updateProjectCredentialAction({
          projectId,
          credentialId: editingId,
          name: form.name,
          url: form.url,
          username: form.username,
          password: form.password,
          comments: form.comments,
        });

        setCredentials((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        toast.success("Credencial actualizada");
      } catch (error) {
        const message = error instanceof Error ? error.message : "No fue posible guardar la credencial";
        toast.error(message);
      }
    });
  };

  const togglePassword = (id: string) => {
    setVisiblePasswordIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error(`No fue posible copiar ${label.toLowerCase()}`);
    }
  };

  const handleDelete = (credential: Credential) => {
    if (isPending) {
      return;
    }

    setCredentialPendingDelete(credential);
  };

  const confirmDeleteCredential = () => {
    if (!credentialPendingDelete || isPending) {
      return;
    }

    const credential = credentialPendingDelete;

    startTransition(async () => {
      try {
        await deleteProjectCredentialAction({
          projectId,
          credentialId: credential.id,
        });

        setCredentials((prev) => prev.filter((item) => item.id !== credential.id));
        setVisiblePasswordIds((prev) => {
          const next = { ...prev };
          delete next[credential.id];
          return next;
        });

        if (editingId === credential.id) {
          resetToCreate();
        }

        setCredentialPendingDelete(null);
        toast.success("Credencial eliminada");
      } catch (error) {
        const message = error instanceof Error ? error.message : "No fue posible eliminar la credencial";
        toast.error(message);
      }
    });
  };

  const isCopyVisible = (rowKey: string) => activeCopyRow === rowKey;

  const toggleCopyRow = (rowKey: string) => {
    setActiveCopyRow((prev) => (prev === rowKey ? null : rowKey));
  };

  const getMobileCopyRevealClass = (rowKey: string) =>
    isCopyVisible(rowKey)
      ? "max-w-10 opacity-100 translate-x-0"
      : "max-w-0 opacity-0 -translate-x-1 pointer-events-none";

  return (
    <>
      <section className="grid min-w-0 max-w-full gap-4 overflow-x-hidden lg:grid-cols-[1.8fr_1fr]">
      <div className="min-w-0 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_12px_30px_rgba(1,8,22,0.3)] sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Accesos del proyecto</h2>
          <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
            {credentials.length}
          </span>
        </div>

        {credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-4 text-sm text-[var(--muted)]">
            No has agregado credenciales todavía. Registra la primera en el panel derecho.
          </div>
        ) : (
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {credentials.map((credential) => {
              const isVisible = Boolean(visiblePasswordIds[credential.id]);
              const userRowKey = `${credential.id}:username`;
              const passwordRowKey = `${credential.id}:password`;

              return (
                <article key={credential.id} className="min-w-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3 sm:p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <div className="min-w-0 basis-0 flex-1">
                      <h3 className="text-sm font-semibold text-[var(--ink)]">{credential.name}</h3>
                      <div className="mt-1 w-full overflow-hidden">
                        <a
                          href={credential.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-[calc(100vw-5.5rem)] truncate text-xs text-[var(--brand)] underline-offset-2 hover:underline sm:max-w-full"
                          title={credential.url}
                        >
                          {credential.url}
                        </a>
                      </div>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(credential)}
                        className={credentialEditButtonClass}
                        title="Editar"
                        aria-label="Editar"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14 5 5 5M4 20l3.5-.5L18 9a1.4 1.4 0 0 0 0-2l-1-1a1.4 1.4 0 0 0-2 0L4.5 16.5 4 20z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(credential)}
                        className={credentialDeleteButtonClass}
                        title="Eliminar"
                        aria-label="Eliminar"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6m-9 4h12m-1 0-.7 11.2A2 2 0 0 1 14.3 20H9.7a2 2 0 0 1-2-1.8L7 7m3 4v5m4-5v5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                    <p
                      className="flex flex-wrap items-center gap-2"
                      onClick={() => toggleCopyRow(userRowKey)}
                    >
                      <span>
                        <span className="font-medium text-[var(--ink)]">Usuario:</span> {credential.username}
                      </span>
                      <span
                        className={`inline-flex overflow-hidden transition-all duration-200 ease-out sm:max-w-10 sm:translate-x-0 sm:opacity-100 sm:pointer-events-auto ${getMobileCopyRevealClass(userRowKey)}`}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCopy(credential.username, "Usuario");
                          }}
                          className={credentialCopyButtonClass}
                          title="Copiar usuario"
                          aria-label="Copiar usuario"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
                            <rect x="9" y="9" width="11" height="11" rx="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </span>
                    </p>
                    <p
                      className="flex flex-wrap items-center gap-2"
                      onClick={() => toggleCopyRow(passwordRowKey)}
                    >
                      <span>
                        <span className="font-medium text-[var(--ink)]">Contraseña:</span>{" "}
                        {isVisible ? credential.password : "••••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          togglePassword(credential.id);
                        }}
                        className={credentialToggleButtonClass}
                        title={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {isVisible ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 5.2A10.9 10.9 0 0 1 12 5c5.3 0 9.3 3.5 10 7-0.3 1.5-1.2 3-2.5 4.2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.3 6.3C4.6 7.5 3.4 9.2 3 12c0.7 3.5 4.7 7 10 7 1.4 0 2.6-.2 3.8-.6" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`inline-flex overflow-hidden transition-all duration-200 ease-out sm:max-w-10 sm:translate-x-0 sm:opacity-100 sm:pointer-events-auto ${getMobileCopyRevealClass(passwordRowKey)}`}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCopy(credential.password, "Contraseña");
                          }}
                          className={credentialCopyButtonClass}
                          title="Copiar contraseña"
                          aria-label="Copiar contraseña"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
                            <rect x="9" y="9" width="11" height="11" rx="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </span>
                    </p>
                    {credential.comments ? (
                      <p className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-2 leading-relaxed">
                        {credential.comments}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <aside className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_12px_30px_rgba(1,8,22,0.3)] sm:p-4 lg:sticky lg:top-4 lg:h-fit">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
              {mode === "create" ? "Nueva credencial" : "Editar credencial"}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-[var(--ink)]">
              {mode === "create" ? "Registrar acceso" : selectedCredential?.name ?? "Actualizar acceso"}
            </h3>
          </div>

          {mode === "edit" ? (
            <button
              type="button"
              onClick={resetToCreate}
              className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              Nueva
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]" htmlFor="credential-name">
              Nombre
            </label>
            <input
              id="credential-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
              placeholder="Ej: Hosting principal"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]" htmlFor="credential-url">
              URL
            </label>
            <input
              id="credential-url"
              value={form.url}
              onChange={(event) => updateField("url", event.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]" htmlFor="credential-username">
              Usuario
            </label>
            <input
              id="credential-username"
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
              placeholder="usuario@dominio.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]" htmlFor="credential-password">
              Contraseña
            </label>
            <input
              id="credential-password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
              placeholder="Contraseña"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]" htmlFor="credential-comments">
              Comentarios
            </label>
            <textarea
              id="credential-comments"
              value={form.comments}
              onChange={(event) => updateField("comments", event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30"
              placeholder="Notas útiles para este acceso"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Guardando..." : mode === "create" ? "Agregar credencial" : "Guardar cambios"}
          </button>
          {mode === "edit" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={resetToCreate}
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </aside>
      </section>

      {credentialPendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isPending) {
              setCredentialPendingDelete(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgba(1,8,22,0.6)]">
            <p className="text-sm leading-relaxed text-[var(--ink)]">
              ¿Eliminar la credencial "{credentialPendingDelete.name}"? Esta acción no se puede deshacer.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCredentialPendingDelete(null)}
                disabled={isPending}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCredential}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
