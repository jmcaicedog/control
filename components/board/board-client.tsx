"use client";

import { useMemo, useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<BoardColumn>("todo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CardType>("simple");
  const [checklistText, setChecklistText] = useState("");
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

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

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-4">
          {columns.map((column) => (
            <section key={column.id} className="min-w-[82vw] snap-start rounded-xl border border-[var(--line)] bg-white p-3 md:min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">{column.label}</h2>
                <button
                  type="button"
                  onClick={() => openCreate(column.id)}
                  className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold hover:bg-[var(--soft)]"
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
                      onDelete={() => {
                        const ok = window.confirm("¿Eliminar esta tarea?");
                        if (!ok) {
                          return;
                        }
                        setCards((prev) => prev.filter((item) => item.id !== card.id));
                        startTransition(async () => {
                          await deleteCardAction({ projectId, cardId: card.id });
                        });
                      }}
                      onToggleChecklist={(itemId, value) => {
                        setCards((prev) =>
                          prev.map((item) =>
                            item.id !== card.id
                              ? item
                              : {
                                  ...item,
                                  checklist: item.checklist.map((check) =>
                                    check.id === itemId ? { ...check, isCompleted: value } : check
                                  ),
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
                              : { ...item, checklist: item.checklist.filter((check) => check.id !== itemId) }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <h3 className="text-lg font-bold">Nueva tarea en {columns.find((c) => c.id === targetColumn)?.label}</h3>
            <div className="mt-4 space-y-3">
              <input
                placeholder="Título"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
              />
              <textarea
                placeholder="Descripción"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
              />
              <select
                value={type}
                onChange={(event) => setType(event.target.value as CardType)}
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
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
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
                />
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={createCard}
                className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Crear
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
      className={`min-h-[140px] space-y-2 rounded-lg bg-[var(--soft)]/70 p-2 transition ${
        isOver ? "ring-2 ring-[var(--brand)]" : ""
      }`}
    >
      {children}
    </div>
  );
}

type SortableCardProps = {
  card: BoardCard;
  onDelete: () => void;
  onToggleChecklist: (itemId: string, value: boolean) => void;
  onAddChecklist: (title: string) => Promise<void>;
  onDeleteChecklist: (itemId: string) => Promise<void>;
};

function SortableCard({ card, onDelete, onToggleChecklist, onAddChecklist, onDeleteChecklist }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const [newItem, setNewItem] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completed = card.checklist.filter((item) => item.isCompleted).length;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-[var(--line)] bg-white p-3 shadow-sm"
      data-dragging={isDragging}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          className="cursor-grab rounded-md border border-[var(--line)] px-2 py-1 text-left text-sm font-semibold"
          {...attributes}
          {...listeners}
        >
          {card.title}
        </button>
        <button onClick={onDelete} type="button" className="text-xs text-red-600">
          Eliminar
        </button>
      </div>

      {card.description ? <p className="text-sm text-[var(--muted)]">{card.description}</p> : null}

      {card.type === "checklist" ? (
        <div className="mt-3 rounded-md bg-[var(--soft)] p-2">
          <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
            Checklist {completed}/{card.checklist.length}
          </p>
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
                  className="text-red-600"
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
              className="w-full rounded border border-[var(--line)] px-2 py-1 text-xs"
            />
            <button
              type="button"
              className="rounded border border-[var(--line)] px-2 py-1 text-xs"
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
    </article>
  );
}
