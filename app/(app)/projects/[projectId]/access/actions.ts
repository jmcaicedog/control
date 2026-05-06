"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { projectCredentials, projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { projectCredentialSchema, updateProjectCredentialSchema } from "@/lib/validators";

async function assertProjectOwnership(projectId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No autorizado");
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id), eq(projects.type, "project")))
    .limit(1);

  if (!project) {
    throw new Error("Proyecto no encontrado");
  }
}

export async function createProjectCredentialAction(input: {
  projectId: string;
  name: string;
  url: string;
  username: string;
  password: string;
  comments?: string;
}) {
  await assertProjectOwnership(input.projectId);

  const parsed = projectCredentialSchema.parse(input);

  const credentialId = randomUUID();

  await db.insert(projectCredentials).values({
    id: credentialId,
    projectId: input.projectId,
    name: parsed.name,
    url: parsed.url,
    username: parsed.username,
    password: parsed.password,
    comments: parsed.comments || "",
  });

  revalidatePath(`/projects/${input.projectId}/access`);

  return {
    id: credentialId,
    name: parsed.name,
    url: parsed.url,
    username: parsed.username,
    password: parsed.password,
    comments: parsed.comments || "",
  };
}

export async function updateProjectCredentialAction(input: {
  projectId: string;
  credentialId: string;
  name: string;
  url: string;
  username: string;
  password: string;
  comments?: string;
}) {
  await assertProjectOwnership(input.projectId);

  const parsed = updateProjectCredentialSchema.parse(input);

  const [credential] = await db
    .select({ id: projectCredentials.id })
    .from(projectCredentials)
    .where(
      and(
        eq(projectCredentials.id, parsed.credentialId),
        eq(projectCredentials.projectId, input.projectId)
      )
    )
    .limit(1);

  if (!credential) {
    throw new Error("Credencial no encontrada");
  }

  await db
    .update(projectCredentials)
    .set({
      name: parsed.name,
      url: parsed.url,
      username: parsed.username,
      password: parsed.password,
      comments: parsed.comments || "",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projectCredentials.id, parsed.credentialId),
        eq(projectCredentials.projectId, input.projectId)
      )
    );

  revalidatePath(`/projects/${input.projectId}/access`);

  return {
    id: parsed.credentialId,
    name: parsed.name,
    url: parsed.url,
    username: parsed.username,
    password: parsed.password,
    comments: parsed.comments || "",
  };
}

export async function deleteProjectCredentialAction(input: {
  projectId: string;
  credentialId: string;
}) {
  await assertProjectOwnership(input.projectId);

  const [credential] = await db
    .select({ id: projectCredentials.id })
    .from(projectCredentials)
    .where(
      and(
        eq(projectCredentials.id, input.credentialId),
        eq(projectCredentials.projectId, input.projectId)
      )
    )
    .limit(1);

  if (!credential) {
    throw new Error("Credencial no encontrada");
  }

  await db
    .delete(projectCredentials)
    .where(
      and(
        eq(projectCredentials.id, input.credentialId),
        eq(projectCredentials.projectId, input.projectId)
      )
    );

  revalidatePath(`/projects/${input.projectId}/access`);
}
