"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
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
  position: number;
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

  const orderedPendingTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => !task.isCompleted)
      .sort((a, b) => b.position - a.position);
  }, [tasks]);

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

      <ul className="divide-y divide-[var(--line)]">
        {orderedPendingTasks.map((task) => {
          const completedItems = task.checklist.filter((item) => item.isCompleted).length;
          const progress = task.type === "checklist"
            ? (task.checklist.length > 0 ? Math.round((completedItems / task.checklist.length) * 100) : 0)
            : (task.isCompleted ? 100 : 0);

          return (
            <li key={task.id} className="px-4 py-3">
              <div className="grid gap-3 md:grid-cols-[80px_1.6fr_1fr_110px_1fr_230px] md:items-center">
                <div className="text-xs font-semibold text-[var(--muted)]">
                  <span className="md:hidden">Prioridad: </span>
                  {task.position}
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
                            onChange={(event) => toggleChecklistTaskItem(task.id, item.id, event.target.checked)}
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
                      onClick={() => toggleSimpleTask(task)}
                      disabled={isPending}
                      className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-70"
                    >
                      Completar
                    </button>
                  ) : null}
                  <Link
                    href={`/projects/${task.projectId}/board`}
                    className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    Ver canvan
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
