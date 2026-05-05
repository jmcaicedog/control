"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createProjectCredentialAction, updateProjectCredentialAction } from "@/app/(app)/projects/[projectId]/access/actions";

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

const MAX_CREDENTIALS_PER_PROJECT = 5;

const emptyForm: FormState = {
  name: "",
  url: "",
  username: "",
  password: "",
  comments: "",
};

export function ProjectAccessPanel({ projectId, initialCredentials }: ProjectAccessPanelProps) {
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isPending, startTransition] = useTransition();

  const canCreate = credentials.length < MAX_CREDENTIALS_PER_PROJECT;

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

    if (mode === "create" && !canCreate) {
      toast.error("Este proyecto ya tiene 5 credenciales");
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

  return (
    <section className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
      <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_30px_rgba(1,8,22,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Accesos del proyecto</h2>
          <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
            {credentials.length} / {MAX_CREDENTIALS_PER_PROJECT}
          </span>
        </div>

        {credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-4 text-sm text-[var(--muted)]">
            No has agregado credenciales todavía. Registra la primera en el panel derecho.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {credentials.map((credential) => {
              const isVisible = Boolean(visiblePasswordIds[credential.id]);

              return (
                <article key={credential.id} className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--ink)]">{credential.name}</h3>
                      <a
                        href={credential.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-[var(--brand)] underline-offset-2 hover:underline"
                      >
                        {credential.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(credential)}
                      className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                    >
                      Editar
                    </button>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                    <p>
                      <span className="font-medium text-[var(--ink)]">Usuario:</span> {credential.username}
                    </p>
                    <p className="flex items-center gap-2">
                      <span>
                        <span className="font-medium text-[var(--ink)]">Contraseña:</span>{" "}
                        {isVisible ? credential.password : "••••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePassword(credential.id)}
                        className="rounded-md border border-[var(--line)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                      >
                        {isVisible ? "Ocultar" : "Mostrar"}
                      </button>
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

      <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_12px_30px_rgba(1,8,22,0.3)] lg:sticky lg:top-4 lg:h-fit">
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

        {!canCreate && mode === "create" ? (
          <p className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-100">
            Alcanzaste el límite de 5 credenciales para este proyecto. Edita una existente si necesitas cambiar datos.
          </p>
        ) : null}

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
            disabled={isPending || (mode === "create" && !canCreate)}
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
  );
}
