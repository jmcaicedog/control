"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  addChecklistItemAction,
  createCardAction,
  deleteCardAction,
  deleteChecklistItemAction,
  moveCardAction,
  toggleCardCompletionAction,
  toggleChecklistItemAction,
} from "@/app/(app)/projects/[projectId]/board/actions";

type BoardColumn = "todo" | "doing" | "in_review" | "done";
type CardType = "simple" | "checklist";

type ChecklistItem = {
  id: string;
  title: string;
  isCompleted: boolean;
};

type BoardCard = {
  id: string;
  title: string;
  description: string;
  columnName: BoardColumn;
  position: number;
  type: CardType;
  isCompleted: boolean;
  checklist: ChecklistItem[];
};

type BoardClientProps = {
  projectId: string;
  initialCards: BoardCard[];
};

const columns: Array<{ id: BoardColumn; label: string }> = [
  { id: "todo", label: "ToDo" },
  { id: "doing", label: "Doing" },
  { id: "in_review", label: "InReview" },
  { id: "done", label: "Done" },
];

export function BoardClient({ projectId, initialCards }: BoardClientProps) {
  const [cards, setCards] = useState<BoardCard[]>(initialCards);
  const [cardToDelete, setCardToDelete] = useState<{ id: string; title: string } | null>(null);
  const lastDeleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const deleteModalRef = useRef<HTMLDivElement | null>(null);
  const cancelDeleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmDeleteButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<BoardColumn>("todo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CardType>("simple");
  const [checklistText, setChecklistText] = useState("");
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const byColumn = useMemo(() => {
    return columns.reduce<Record<BoardColumn, BoardCard[]>>((acc, col) => {
      acc[col.id] = cards
        .filter((card) => card.columnName === col.id)
        .sort((a, b) => a.position - b.position);
      return acc;
    }, { todo: [], doing: [], in_review: [], done: [] });
  }, [cards]);

  const findCard = (cardId: string) => cards.find((card) => card.id === cardId);

  const findColumnByCardId = (cardId: string): BoardColumn | null => {
    const card = findCard(cardId);
    return card?.columnName ?? null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const cardId = String(active.id);
    const overId = String(over.id);
    const sourceCol = findColumnByCardId(cardId);

    let targetCol: BoardColumn | null = null;

    if (columns.some((column) => column.id === overId)) {
      targetCol = overId as BoardColumn;
    } else {
      targetCol = findColumnByCardId(overId);
    }

    if (!sourceCol || !targetCol) {
      return;
    }

    if (sourceCol === targetCol && cardId === overId) {
      return;
    }

    const sourceCards = [...byColumn[sourceCol]];
    const targetCards = sourceCol === targetCol ? sourceCards : [...byColumn[targetCol]];
    const movingCard = sourceCards.find((card) => card.id === cardId);

    if (!movingCard) {
      return;
    }

    const toPosition =
      columns.some((column) => column.id === overId)
        ? targetCards.length
        : Math.max(0, targetCards.findIndex((card) => card.id === overId));

    setCards((prev) => {
      const next = [...prev];

      const sourceOrdered = next
        .filter((card) => card.columnName === sourceCol)
        .sort((a, b) => a.position - b.position)
        .filter((card) => card.id !== cardId);

      const targetOrdered =
        sourceCol === targetCol
          ? sourceOrdered
          : next.filter((card) => card.columnName === targetCol).sort((a, b) => a.position - b.position);

      const insertIndex = Math.max(0, Math.min(toPosition, targetOrdered.length));
      const movedCard = { ...movingCard, columnName: targetCol };

      if (sourceCol === targetCol) {
        const reordered = [...sourceOrdered];
        reordered.splice(insertIndex, 0, movedCard);
        const byId = new Map(reordered.map((card, index) => [card.id, { ...card, position: index }]));

        return next.map((card) => byId.get(card.id) ?? card);
      }

      const reorderedTarget = [...targetOrdered];
      reorderedTarget.splice(insertIndex, 0, movedCard);
      const sourceMap = new Map(sourceOrdered.map((card, index) => [card.id, { ...card, position: index }]));
      const targetMap = new Map(
        reorderedTarget.map((card, index) => [card.id, { ...card, columnName: targetCol, position: index }])
      );

      return next.map((card) => targetMap.get(card.id) ?? sourceMap.get(card.id) ?? card);
    });

    startTransition(async () => {
      try {
        await moveCardAction({
          projectId,
          cardId,
          toColumn: targetCol,
          toPosition,
        });
      } catch {
        toast.error("No fue posible mover la tarjeta");
      }
    });
  };

  const openCreate = (column: BoardColumn) => {
    setTargetColumn(column);
    setTitle("");
    setDescription("");
    setType("simple");
    setChecklistText("");
    setIsCreateOpen(true);
  };

  const createCard = async () => {
    if (!title.trim()) {
      toast.error("Debes ingresar un título");
      return;
    }

    const checklistItems = checklistText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const temporaryId = `tmp-${Math.random()}`;
    setCards((prev) => [
      ...prev,
      {
        id: temporaryId,
        title,
        description,
        type,
        columnName: targetColumn,
        position: byColumn[targetColumn].length,
        isCompleted: false,
        checklist: checklistItems.map((item, i) => ({
          id: `${temporaryId}-${i}`,
          title: item,
          isCompleted: false,
        })),
      },
    ]);

    setIsCreateOpen(false);

    startTransition(async () => {
      try {
        await createCardAction({
          projectId,
          title,
          description,
          type,
          columnName: targetColumn,
          checklistItems: type === "checklist" ? checklistItems : [],
        });
        toast.success("Tarea creada");
      } catch {
        toast.error("No fue posible crear la tarea");
      }
    });
  };

  const closeDeleteModal = useCallback(() => {
    setCardToDelete(null);
    requestAnimationFrame(() => {
      lastDeleteTriggerRef.current?.focus();
    });
  }, []);

  const confirmDeleteCard = useCallback(() => {
    const target = cardToDelete;
    if (!target || isPending) {
      return;
    }

    lastDeleteTriggerRef.current = null;
    setCards((prev) => prev.filter((item) => item.id !== target.id));
    setCardToDelete(null);

    startTransition(async () => {
      await deleteCardAction({ projectId, cardId: target.id });
    });
  }, [cardToDelete, isPending, projectId, startTransition]);

  useEffect(() => {
    if (!cardToDelete) {
      return;
    }

    cancelDeleteButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!cardToDelete) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeDeleteModal();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        confirmDeleteCard();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const modal = deleteModalRef.current;
      if (!modal) {
        return;
      }

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [cardToDelete, isPending, closeDeleteModal, confirmDeleteCard]);

  if (!hasMounted) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
        Cargando tablero...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-4">
          {columns.map((column) => (
            <section
              key={column.id}
              className="min-w-[82vw] snap-start rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_10px_26px_rgba(1,8,22,0.35)] md:min-w-0"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--brand)]">{column.label}</h2>
                <button
                  type="button"
                  onClick={() => openCreate(column.id)}
                  className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  + Card
                </button>
              </div>

              <SortableContext items={byColumn[column.id].map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <DroppableColumn columnId={column.id}>
                  {byColumn[column.id].map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onToggleCardComplete={(value) => {
                        setCards((prev) =>
                          prev.map((item) => (item.id === card.id ? { ...item, isCompleted: value } : item))
                        );

                        startTransition(async () => {
                          try {
                            await toggleCardCompletionAction({
                              projectId,
                              cardId: card.id,
                              isCompleted: value,
                            });
                          } catch {
                            toast.error("No fue posible actualizar el estado de la tarea");
                          }
                        });
                      }}
                      onDelete={(trigger) => {
                        lastDeleteTriggerRef.current = trigger;
                        setCardToDelete({ id: card.id, title: card.title });
                      }}
                      onToggleChecklist={(itemId, value) => {
                        setCards((prev) =>
                          prev.map((item) =>
                            item.id !== card.id
                              ? item
                              : {
                                  ...item,
                                  checklist: (() => {
                                    const nextChecklist = item.checklist.map((check) =>
                                      check.id === itemId ? { ...check, isCompleted: value } : check
                                    );
                                    return nextChecklist;
                                  })(),
                                  isCompleted: (() => {
                                    const nextChecklist = item.checklist.map((check) =>
                                      check.id === itemId ? { ...check, isCompleted: value } : check
                                    );
                                    return nextChecklist.length > 0 && nextChecklist.every((check) => check.isCompleted);
                                  })(),
                                }
                          )
                        );
                        startTransition(async () => {
                          await toggleChecklistItemAction({ projectId, itemId, isCompleted: value });
                        });
                      }}
                      onAddChecklist={async (text) => {
                        if (!text.trim()) {
                          return;
                        }
                        await addChecklistItemAction({ projectId, cardId: card.id, title: text.trim() });
                        toast.success("Checklist agregado");
                      }}
                      onDeleteChecklist={async (itemId) => {
                        await deleteChecklistItemAction({ projectId, itemId });
                        setCards((prev) =>
                          prev.map((item) =>
                            item.id !== card.id
                              ? item
                              : (() => {
                                  const nextChecklist = item.checklist.filter((check) => check.id !== itemId);
                                  return {
                                    ...item,
                                    checklist: nextChecklist,
                                    isCompleted: nextChecklist.length > 0 && nextChecklist.every((check) => check.isCompleted),
                                  };
                                })()
                          )
                        );
                      }}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </section>
          ))}
        </div>
      </DndContext>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <h3 className="text-lg font-bold text-[var(--ink)]">Nueva tarea en {columns.find((c) => c.id === targetColumn)?.label}</h3>
            <div className="mt-4 space-y-3">
              <input
                placeholder="Título"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] placeholder:text-[var(--muted)]"
              />
              <textarea
                placeholder="Descripción"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] placeholder:text-[var(--muted)]"
              />
              <select
                value={type}
                onChange={(event) => setType(event.target.value as CardType)}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)]"
              >
                <option value="simple">Simple</option>
                <option value="checklist">Checklist</option>
              </select>
              {type === "checklist" ? (
                <textarea
                  rows={4}
                  value={checklistText}
                  onChange={(event) => setChecklistText(event.target.value)}
                  placeholder="Un item por línea"
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[var(--ink)] placeholder:text-[var(--muted)]"
                />
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={createCard}
                className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-[#061425] transition hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] disabled:opacity-60"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cardToDelete ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            ref={deleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-card-modal-title"
            aria-describedby="delete-card-modal-description"
            className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--brand)]">Confirmar acción</p>
            <h3 id="delete-card-modal-title" className="mt-2 text-lg font-bold text-[var(--ink)]">Eliminar tarea</h3>
            <p id="delete-card-modal-description" className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Esta acción no se puede deshacer. Se eliminará <strong className="text-[var(--ink)]">{cardToDelete.title}</strong>.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelDeleteButtonRef}
                type="button"
                onClick={closeDeleteModal}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                Cancelar
              </button>
              <button
                ref={confirmDeleteButtonRef}
                type="button"
                disabled={isPending}
                onClick={confirmDeleteCard}
                className="rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:-translate-y-0.5 hover:bg-red-500/20 disabled:opacity-60"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DroppableColumn({
  columnId,
  children,
}: {
  columnId: BoardColumn;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[140px] space-y-2 rounded-lg border border-[var(--line)] bg-[var(--soft)] p-2 transition ${
        isOver ? "ring-2 ring-[var(--brand)]" : ""
      }`}
    >
      {children}
    </div>
  );
}

type SortableCardProps = {
  card: BoardCard;
  onToggleCardComplete: (value: boolean) => void;
  onDelete: (trigger: HTMLButtonElement) => void;
  onToggleChecklist: (itemId: string, value: boolean) => void;
  onAddChecklist: (title: string) => Promise<void>;
  onDeleteChecklist: (itemId: string) => Promise<void>;
};

function SortableCard({ card, onToggleCardComplete, onDelete, onToggleChecklist, onAddChecklist, onDeleteChecklist }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const [newItem, setNewItem] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completed = card.checklist.filter((item) => item.isCompleted).length;
  const checklistProgress = card.checklist.length > 0 ? Math.round((completed / card.checklist.length) * 100) : 0;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-3 shadow-[0_6px_16px_rgba(1,8,22,0.28)] ${
        card.isCompleted
          ? "border-[var(--brand)] bg-[color:rgba(19,212,197,0.09)]"
          : "border-[var(--line)] bg-[var(--surface-2)]"
      }`}
      data-dragging={isDragging}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          className={`cursor-grab rounded-md border border-[var(--line)] px-2 py-1 text-left text-base font-semibold tracking-tight ${
            card.isCompleted ? "text-[var(--muted)] line-through" : "text-[var(--ink)]"
          }`}
          {...attributes}
          {...listeners}
        >
          {card.title}
        </button>
        <button
          type="button"
          aria-label={card.isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
          onClick={() => {
            if (card.type === "simple") {
              onToggleCardComplete(!card.isCompleted);
            }
          }}
          className={`h-9 w-9 rounded-md border text-lg font-bold transition ${
            card.isCompleted
              ? "border-[var(--brand)] bg-[color:rgba(19,212,197,0.2)] text-[var(--brand)]"
              : "border-[var(--line)] bg-[var(--soft)] text-[var(--muted)]"
          } ${card.type === "checklist" ? "cursor-default opacity-90" : "hover:border-[var(--brand)] hover:text-[var(--brand)]"}`}
        >
          ✓
        </button>
      </div>

      {card.description ? (
        <p className={`text-sm leading-relaxed ${card.isCompleted ? "text-[var(--muted)] line-through opacity-80" : "text-[var(--muted)]"}`}>
          {card.description}
        </p>
      ) : null}

      {card.type === "checklist" ? (
        <div className="mt-3 rounded-md border border-[var(--line)] bg-[var(--soft)] p-2">
          <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
            Checklist {completed}/{card.checklist.length} ({checklistProgress}%)
          </p>
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full bg-[var(--brand)] transition-all" style={{ width: `${checklistProgress}%` }} />
          </div>
          <div className="space-y-1">
            {card.checklist.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={(event) => onToggleChecklist(item.id, event.target.checked)}
                  />
                  <span className={item.isCompleted ? "line-through opacity-70" : ""}>{item.title}</span>
                </label>
                <button
                  type="button"
                  className="text-red-300 hover:text-red-200"
                  onClick={() => onDeleteChecklist(item.id)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              placeholder="Nuevo item"
              className="w-full rounded border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--ink)] placeholder:text-[var(--muted)]"
            />
            <button
              type="button"
              className="rounded border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
              onClick={async () => {
                if (!newItem.trim()) {
                  return;
                }
                await onAddChecklist(newItem);
                setNewItem("");
              }}
            >
              +
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          {card.isCompleted ? "Completada" : "Arrastra para mover"}
        </span>
        <button
          onClick={(event) => onDelete(event.currentTarget)}
          type="button"
          className="text-xs font-medium text-red-300 transition hover:text-red-200"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
