"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { closestCenter, DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  reorderDashboardTasksAction,
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

type DashboardTask = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  columnName: BoardColumn;
  priority: number;
  type: CardType;
  isCompleted: boolean;
  checklist: ChecklistItem[];
};

type DashboardTasksClientProps = {
  initialTasks: DashboardTask[];
};

const columnLabels: Record<BoardColumn, string> = {
  todo: "ToDo",
  doing: "Doing",
  in_review: "InReview",
  done: "Done",
};

export function DashboardTasksClient({ initialTasks }: DashboardTasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const orderedPendingTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => !task.isCompleted)
      .sort((a, b) => a.priority - b.priority);
  }, [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      return;
    }

    const oldIndex = orderedPendingTasks.findIndex((task) => task.id === activeId);
    const newIndex = orderedPendingTasks.findIndex((task) => task.id === overId);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousTasks = tasks;
    const reordered = arrayMove(orderedPendingTasks, oldIndex, newIndex);
    const nextPriorityById = new Map(reordered.map((task, index) => [task.id, index + 1]));

    setTasks((prev) =>
      prev.map((task) => {
        const nextPriority = nextPriorityById.get(task.id);
        if (nextPriority === undefined) {
          return task;
        }

        return {
          ...task,
          priority: nextPriority,
        };
      })
    );

    startTransition(async () => {
      try {
        await reorderDashboardTasksAction({
          orderedCardIds: reordered.map((task) => task.id),
        });
      } catch {
        setTasks(previousTasks);
        toast.error("No fue posible guardar el nuevo orden de prioridad");
      }
    });
  };

  const toggleSimpleTask = (task: DashboardTask) => {
    const nextValue = !task.isCompleted;

    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, isCompleted: nextValue } : item))
    );

    startTransition(async () => {
      try {
        await toggleCardCompletionAction({
          projectId: task.projectId,
          cardId: task.id,
          isCompleted: nextValue,
        });
      } catch {
        setTasks((prev) =>
          prev.map((item) => (item.id === task.id ? { ...item, isCompleted: task.isCompleted } : item))
        );
        toast.error("No fue posible actualizar la tarea");
      }
    });
  };

  const toggleChecklistTaskItem = (taskId: string, itemId: string, value: boolean) => {
    const previousTask = tasks.find((task) => task.id === taskId);
    if (!previousTask) {
      return;
    }

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextChecklist = task.checklist.map((item) =>
          item.id === itemId ? { ...item, isCompleted: value } : item
        );

        return {
          ...task,
          checklist: nextChecklist,
          isCompleted: nextChecklist.length > 0 && nextChecklist.every((item) => item.isCompleted),
        };
      })
    );

    startTransition(async () => {
      try {
        await toggleChecklistItemAction({
          projectId: previousTask.projectId,
          itemId,
          isCompleted: value,
        });
      } catch {
        setTasks((prev) => prev.map((task) => (task.id === previousTask.id ? previousTask : task)));
        toast.error("No fue posible actualizar el progreso");
      }
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="hidden grid-cols-[80px_1.6fr_1fr_110px_1fr_230px] items-center gap-3 border-b border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:grid">
        <span>Prioridad</span>
        <span>Tarea</span>
        <span>Proyecto</span>
        <span>Categoria</span>
        <span>Progreso</span>
        <span>Acciones</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedPendingTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-[var(--line)]">
            {orderedPendingTasks.map((task) => (
              <SortableDashboardTaskRow
                key={task.id}
                task={task}
                isPending={isPending}
                onToggleSimpleTask={toggleSimpleTask}
                onToggleChecklistTaskItem={toggleChecklistTaskItem}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

type SortableDashboardTaskRowProps = {
  task: DashboardTask;
  isPending: boolean;
  onToggleSimpleTask: (task: DashboardTask) => void;
  onToggleChecklistTaskItem: (taskId: string, itemId: string, value: boolean) => void;
};

function SortableDashboardTaskRow({
  task,
  isPending,
  onToggleSimpleTask,
  onToggleChecklistTaskItem,
}: SortableDashboardTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const completedItems = task.checklist.filter((item) => item.isCompleted).length;
  const progress = task.type === "checklist"
    ? (task.checklist.length > 0 ? Math.round((completedItems / task.checklist.length) * 100) : 0)
    : (task.isCompleted ? 100 : 0);

  return (
    <li
      ref={setNodeRef}
      className="px-4 py-3"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      <div className="grid gap-3 md:grid-cols-[80px_1.6fr_1fr_110px_1fr_230px] md:items-center">
        <div className="text-xs font-semibold text-[var(--muted)]">
          <span className="md:hidden">Prioridad: </span>
          {task.priority}
          <button
            type="button"
            aria-label="Reordenar tarea"
            className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            {...attributes}
            {...listeners}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5h8M8 12h8M8 19h8" />
            </svg>
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">{task.title}</p>
          {task.description ? <p className="mt-1 text-xs text-[var(--muted)]">{task.description}</p> : null}
        </div>

        <p className="text-xs text-[var(--muted)]">
          <span className="md:hidden">Proyecto: </span>
          {task.projectName}
        </p>

        <p className="text-xs font-semibold text-[var(--brand)]">
          <span className="md:hidden text-[var(--muted)]">Categoria: </span>
          {columnLabels[task.columnName]}
        </p>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
            <span>Progreso</span>
            <strong className="text-[var(--ink)]">{progress}%</strong>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full bg-[var(--brand)] transition-all" style={{ width: `${progress}%` }} />
          </div>

          {task.type === "checklist" ? (
            <div className="mt-2 space-y-1">
              {task.checklist.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-xs text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={(event) => onToggleChecklistTaskItem(task.id, item.id, event.target.checked)}
                    disabled={isPending}
                  />
                  <span className={item.isCompleted ? "line-through opacity-70" : ""}>{item.title}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {task.type === "simple" ? (
            <button
              type="button"
              onClick={() => onToggleSimpleTask(task)}
              aria-label="Completar tarea"
              disabled={isPending}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-70"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
              </svg>
            </button>
          ) : null}
          <Link
            href={`/projects/${task.projectId}/board`}
            aria-label="Ver tablero"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h7v6H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 13h7v6H4z" />
            </svg>
          </Link>
        </div>
      </div>
    </li>
  );
}
