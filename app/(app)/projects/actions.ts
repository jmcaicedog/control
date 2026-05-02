"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { convertQuoteSchema, projectSchema, quoteSchema } from "@/lib/validators";

async function getUserOrRedirect() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function createProjectAction(formData: FormData) {
  const user = await getUserOrRedirect();

  const parsed = projectSchema.parse({
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail"),
    clientPhone: formData.get("clientPhone"),
    description: formData.get("description"),
    totalValue: formData.get("totalValue"),
    advanceValue: formData.get("advanceValue"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  await db.insert(projects).values({
    id: randomUUID(),
    userId: user.id,
    type: "project",
    name: parsed.name,
    clientName: parsed.clientName,
    clientEmail: parsed.clientEmail || null,
    clientPhone: parsed.clientPhone || null,
    description: parsed.description || "",
    totalValue: parsed.totalValue.toFixed(2),
    advanceValue: parsed.advanceValue.toFixed(2),
    startDate: parsed.startDate,
    endDate: parsed.endDate,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createQuoteAction(formData: FormData) {
  const user = await getUserOrRedirect();

  const parsed = quoteSchema.parse({
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail"),
    clientPhone: formData.get("clientPhone"),
    description: formData.get("description"),
    totalValue: formData.get("totalValue"),
    advanceValue: formData.get("advanceValue"),
  });

  await db.insert(projects).values({
    id: randomUUID(),
    userId: user.id,
    type: "quote",
    name: parsed.name,
    clientName: parsed.clientName,
    clientEmail: parsed.clientEmail || null,
    clientPhone: parsed.clientPhone || null,
    description: parsed.description || "",
    totalValue: parsed.totalValue.toFixed(2),
    advanceValue: parsed.advanceValue.toFixed(2),
    startDate: null,
    endDate: null,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const user = await getUserOrRedirect();

  const parsed = projectSchema.parse({
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail"),
    clientPhone: formData.get("clientPhone"),
    description: formData.get("description"),
    totalValue: formData.get("totalValue"),
    advanceValue: formData.get("advanceValue"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  await db
    .update(projects)
    .set({
      type: "project",
      name: parsed.name,
      clientName: parsed.clientName,
      clientEmail: parsed.clientEmail || null,
      clientPhone: parsed.clientPhone || null,
      description: parsed.description || "",
      totalValue: parsed.totalValue.toFixed(2),
      advanceValue: parsed.advanceValue.toFixed(2),
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}/board`);
  redirect("/dashboard");
}

export async function updateQuoteAction(projectId: string, formData: FormData) {
  const user = await getUserOrRedirect();

  const parsed = quoteSchema.parse({
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail"),
    clientPhone: formData.get("clientPhone"),
    description: formData.get("description"),
    totalValue: formData.get("totalValue"),
    advanceValue: formData.get("advanceValue"),
  });

  await db
    .update(projects)
    .set({
      type: "quote",
      name: parsed.name,
      clientName: parsed.clientName,
      clientEmail: parsed.clientEmail || null,
      clientPhone: parsed.clientPhone || null,
      description: parsed.description || "",
      totalValue: parsed.totalValue.toFixed(2),
      advanceValue: parsed.advanceValue.toFixed(2),
      startDate: null,
      endDate: null,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id), eq(projects.type, "quote")));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function convertQuoteToProjectAction(projectId: string, formData: FormData) {
  const user = await getUserOrRedirect();

  const parsed = convertQuoteSchema.parse({
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail"),
    clientPhone: formData.get("clientPhone"),
    description: formData.get("description"),
    totalValue: formData.get("totalValue"),
    advanceValue: formData.get("advanceValue"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  await db
    .update(projects)
    .set({
      type: "project",
      name: parsed.name,
      clientName: parsed.clientName,
      clientEmail: parsed.clientEmail || null,
      clientPhone: parsed.clientPhone || null,
      description: parsed.description || "",
      totalValue: parsed.totalValue.toFixed(2),
      advanceValue: parsed.advanceValue.toFixed(2),
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id), eq(projects.type, "quote")));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteProjectAction(projectId: string) {
  const user = await getUserOrRedirect();

  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, user.id)));
  revalidatePath("/dashboard");
}

export async function archiveProjectAction(projectId: string) {
  const user = await getUserOrRedirect();

  await db
    .update(projects)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, user.id),
        eq(projects.type, "project")
      )
    );

  revalidatePath("/dashboard");
}

export async function restoreProjectAction(projectId: string) {
  const user = await getUserOrRedirect();

  await db
    .update(projects)
    .set({
      isArchived: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, user.id),
        eq(projects.type, "project")
      )
    );

  revalidatePath("/dashboard");
}
