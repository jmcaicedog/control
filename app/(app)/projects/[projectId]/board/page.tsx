import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BoardClient } from "@/components/board/board-client";
import { db } from "@/db";
import { cards, checklistItems, projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

type Params = Promise<{ projectId: string }>;

export default async function ProjectBoardPage({ params }: { params: Params }) {
  const { projectId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    notFound();
  }

  const projectCards = await db
    .select()
    .from(cards)
    .where(eq(cards.projectId, project.id))
    .orderBy(asc(cards.position), asc(cards.createdAt));

  const projectCardIds = projectCards.map((card) => card.id);

  const items = await db
    .select()
    .from(checklistItems)
    .where(projectCardIds.length ? inArray(checklistItems.cardId, projectCardIds) : undefined)
    .orderBy(asc(checklistItems.position));

  const boardCards = projectCards.map((card) => ({
    id: card.id,
    title: card.title,
    description: card.description,
    columnName: card.columnName,
    position: card.position,
    type: card.type,
    checklist: items
      .filter((item) => item.cardId === card.id)
      .map((item) => ({
        id: item.id,
        title: item.title,
        isCompleted: item.isCompleted,
      })),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(1,8,22,0.3)]">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Kanban</p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">{project.name}</h1>
          <p className="text-sm text-[var(--muted)]">Cliente: {project.clientName}</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          Volver
        </Link>
      </div>

      <BoardClient projectId={project.id} initialCards={boardCards} />
    </div>
  );
}
