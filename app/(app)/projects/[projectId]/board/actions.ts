"use server";

import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cards, checklistItems, projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { cardSchema } from "@/lib/validators";

type CardColumn = "todo" | "doing" | "in_review" | "done";
type CardType = "simple" | "checklist";

async function syncChecklistCardCompletion(cardId: string) {
  const items = await db
    .select({ isCompleted: checklistItems.isCompleted })
    .from(checklistItems)
    .where(eq(checklistItems.cardId, cardId));

  const shouldComplete = items.length > 0 && items.every((item) => item.isCompleted);

  await db
    .update(cards)
    .set({ isCompleted: shouldComplete, updatedAt: new Date() })
    .where(eq(cards.id, cardId));
}

async function assertProjectOwnership(projectId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autorizado");
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    throw new Error("Proyecto no encontrado");
  }
}

export async function createCardAction(input: {
  projectId: string;
  title: string;
  description?: string;
  type: CardType;
  columnName: CardColumn;
  checklistItems?: string[];
}) {
  await assertProjectOwnership(input.projectId);

  const parsed = cardSchema.parse(input);

  const existing = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.projectId, input.projectId), eq(cards.columnName, parsed.columnName)))
    .orderBy(asc(cards.position));

  const cardId = randomUUID();

  await db.insert(cards).values({
    id: cardId,
    projectId: input.projectId,
    title: parsed.title,
    description: parsed.description || "",
    type: parsed.type,
    isCompleted: false,
    columnName: parsed.columnName,
    position: existing.length,
  });

  if (parsed.type === "checklist" && parsed.checklistItems?.length) {
    await db.insert(checklistItems).values(
      parsed.checklistItems.map((item, index) => ({
        id: randomUUID(),
        cardId,
        title: item,
        position: index,
      }))
    );
  }

  revalidatePath(`/projects/${input.projectId}/board`);
  revalidatePath("/dashboard");
}

export async function toggleCardCompletionAction(input: {
  projectId: string;
  cardId: string;
  isCompleted: boolean;
}) {
  await assertProjectOwnership(input.projectId);

  const [card] = await db
    .select({ id: cards.id, type: cards.type })
    .from(cards)
    .where(and(eq(cards.id, input.cardId), eq(cards.projectId, input.projectId)))
    .limit(1);

  if (!card) {
    throw new Error("Tarjeta no encontrada");
  }

  if (card.type !== "simple") {
    throw new Error("Las tarjetas checklist se completan automáticamente por progreso");
  }

  await db
    .update(cards)
    .set({ isCompleted: input.isCompleted, updatedAt: new Date() })
    .where(and(eq(cards.id, input.cardId), eq(cards.projectId, input.projectId)));

  revalidatePath(`/projects/${input.projectId}/board`);
  revalidatePath("/dashboard");
}

export async function moveCardAction(input: {
  projectId: string;
  cardId: string;
  toColumn: CardColumn;
  toPosition: number;
}) {
  await assertProjectOwnership(input.projectId);

  const [movingCard] = await db
    .select({
      id: cards.id,
      columnName: cards.columnName,
      position: cards.position,
    })
    .from(cards)
    .where(and(eq(cards.id, input.cardId), eq(cards.projectId, input.projectId)))
    .limit(1);

  if (!movingCard) {
    throw new Error("Tarjeta no encontrada");
  }

  const fromColumn = movingCard.columnName as CardColumn;
  const toColumn = input.toColumn;

  const fromCards = await db
    .select({ id: cards.id })
    .from(cards)
    .where(and(eq(cards.projectId, input.projectId), eq(cards.columnName, fromColumn)))
    .orderBy(asc(cards.position), asc(cards.createdAt));

  const toCards =
    fromColumn === toColumn
      ? fromCards
      : await db
          .select({ id: cards.id })
          .from(cards)
          .where(and(eq(cards.projectId, input.projectId), eq(cards.columnName, toColumn)))
          .orderBy(asc(cards.position), asc(cards.createdAt));

  if (fromColumn === toColumn) {
    const withoutMoving = fromCards.filter((card) => card.id !== input.cardId);
    const boundedPosition = Math.max(0, Math.min(input.toPosition, withoutMoving.length));
    withoutMoving.splice(boundedPosition, 0, { id: input.cardId });

    for (let index = 0; index < withoutMoving.length; index += 1) {
      const card = withoutMoving[index];
      await db
        .update(cards)
        .set({ position: index, updatedAt: new Date() })
        .where(and(eq(cards.id, card.id), eq(cards.projectId, input.projectId)));
    }
  } else {
    const newFromCards = fromCards.filter((card) => card.id !== input.cardId);
    const targetWithoutMoving = toCards.filter((card) => card.id !== input.cardId);
    const boundedPosition = Math.max(0, Math.min(input.toPosition, targetWithoutMoving.length));
    targetWithoutMoving.splice(boundedPosition, 0, { id: input.cardId });

    for (let index = 0; index < newFromCards.length; index += 1) {
      const card = newFromCards[index];
      await db
        .update(cards)
        .set({ position: index, updatedAt: new Date() })
        .where(and(eq(cards.id, card.id), eq(cards.projectId, input.projectId)));
    }

    for (let index = 0; index < targetWithoutMoving.length; index += 1) {
      const card = targetWithoutMoving[index];
      await db
        .update(cards)
        .set({
          columnName: toColumn,
          position: index,
          updatedAt: new Date(),
        })
        .where(and(eq(cards.id, card.id), eq(cards.projectId, input.projectId)));
    }
  }

  revalidatePath(`/projects/${input.projectId}/board`);
  revalidatePath("/dashboard");
}

export async function deleteCardAction(input: { projectId: string; cardId: string }) {
  await assertProjectOwnership(input.projectId);

  await db
    .delete(cards)
    .where(and(eq(cards.id, input.cardId), eq(cards.projectId, input.projectId)));

  revalidatePath(`/projects/${input.projectId}/board`);
  revalidatePath("/dashboard");
}

export async function toggleChecklistItemAction(input: {
  projectId: string;
  itemId: string;
  isCompleted: boolean;
}) {
  await assertProjectOwnership(input.projectId);

  const [item] = await db
    .select({ cardId: checklistItems.cardId })
    .from(checklistItems)
    .innerJoin(cards, eq(checklistItems.cardId, cards.id))
    .where(and(eq(checklistItems.id, input.itemId), eq(cards.projectId, input.projectId)))
    .limit(1);

  if (!item) {
    throw new Error("Item no encontrado");
  }

  await db
    .update(checklistItems)
    .set({ isCompleted: input.isCompleted })
    .where(eq(checklistItems.id, input.itemId));

  await syncChecklistCardCompletion(item.cardId);

  revalidatePath(`/projects/${input.projectId}/board`);
  revalidatePath("/dashboard");
}

export async function addChecklistItemAction(input: {
  projectId: string;
  cardId: string;
  title: string;
}) {
  await assertProjectOwnership(input.projectId);

  const existing = await db
    .select({ id: checklistItems.id })
    .from(checklistItems)
    .where(eq(checklistItems.cardId, input.cardId))
    .orderBy(asc(checklistItems.position));

  const itemId = randomUUID();

  await db.insert(checklistItems).values({
    id: itemId,
    cardId: input.cardId,
    title: input.title,
    position: existing.length,
  });

  await syncChecklistCardCompletion(input.cardId);

  revalidatePath(`/projects/${input.projectId}/board`);
  revalidatePath("/dashboard");

  return {
    id: itemId,
    title: input.title,
    isCompleted: false,
  };
}

export async function deleteChecklistItemAction(input: {
  projectId: string;
  itemId: string;
}) {
  await assertProjectOwnership(input.projectId);

  const [item] = await db
    .select({ cardId: checklistItems.cardId })
    .from(checklistItems)
    .innerJoin(cards, eq(checklistItems.cardId, cards.id))
    .where(and(eq(checklistItems.id, input.itemId), eq(cards.projectId, input.projectId)))
    .limit(1);

  if (!item) {
    throw new Error("Item no encontrado");
  }

  await db.delete(checklistItems).where(eq(checklistItems.id, input.itemId));

  await syncChecklistCardCompletion(item.cardId);

  revalidatePath(`/projects/${input.projectId}/board`);
  revalidatePath("/dashboard");
}

export async function reorderDashboardTasksAction(input: {
  orderedCardIds: string[];
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autorizado");
  }

  const uniqueIds = Array.from(new Set(input.orderedCardIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return;
  }

  const ownedCards = await db
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(projects, eq(cards.projectId, projects.id))
    .where(and(inArray(cards.id, uniqueIds), eq(projects.userId, user.id)));

  if (ownedCards.length !== uniqueIds.length) {
    throw new Error("No autorizado para reordenar estas tareas");
  }

  for (let index = 0; index < uniqueIds.length; index += 1) {
    const cardId = uniqueIds[index];
    const nextPriority = index + 1;

    await db
      .update(cards)
      .set({ position: nextPriority, updatedAt: new Date() })
      .where(eq(cards.id, cardId));
  }

  revalidatePath("/dashboard");
}
