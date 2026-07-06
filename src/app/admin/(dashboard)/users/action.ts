"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  type CreateUserInput,
  type ResetPasswordInput,
  type UpdateUserInput,
} from "./schema";

/**
 * Server actions for Users management (admin-ux-spec §4.7, migration-spec §5.1).
 * Every action is guarded by `requireUser("user:manage")` (ADMIN only), then
 * Zod-validated, then `revalidatePath("/admin/users")`. All return
 * `{ ok, error? }` typed results with friendly error codes (see `schema.ts`).
 *
 * Safety guards prevent locking everyone out of the admin:
 *  - an admin can never deactivate / demote / delete THEIR OWN account, and
 *  - the LAST active ADMIN can never be demoted / deactivated / deleted.
 */

const USERS_PATH = "/admin/users";

type ActionResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: string }>;

function normalizeName(name: string | undefined): string | null {
  const trimmed = name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Would this change leave the club with no active admins? */
async function isLastActiveAdmin(): Promise<boolean> {
  const activeAdmins = await prisma.user.count({
    where: { role: "ADMIN", isActive: true },
  });
  return activeAdmins <= 1;
}

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  await requireUser("user:manage");

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }
  const { email, name, role, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "EMAIL_TAKEN" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email, name: normalizeName(name), role, passwordHash },
  });

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function updateUser(input: UpdateUserInput): Promise<ActionResult> {
  const session = await requireUser("user:manage");

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }
  const { id, role, isActive } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const isSelf = session.user.id === id;
  const demoting = role !== undefined && role !== "ADMIN";
  const deactivating = isActive === false;
  if (isSelf && (demoting || deactivating)) {
    return { ok: false, error: "SELF_FORBIDDEN" };
  }

  // Last-admin guard: only relevant when we drop an active admin's access.
  const removesActiveAdmin =
    target.role === "ADMIN" && target.isActive && (demoting || deactivating);
  if (removesActiveAdmin && (await isLastActiveAdmin())) {
    return { ok: false, error: "LAST_ADMIN" };
  }

  await prisma.user.update({ where: { id }, data: { role, isActive } });

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ActionResult> {
  await requireUser("user:manage");

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }
  const { id, password } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  revalidatePath(USERS_PATH);
  return { ok: true };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const session = await requireUser("user:manage");

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "VALIDATION" };
  }
  if (session.user.id === id) {
    return { ok: false, error: "SELF_FORBIDDEN" };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { ok: false, error: "NOT_FOUND" };
  }

  const removesActiveAdmin = target.role === "ADMIN" && target.isActive;
  if (removesActiveAdmin && (await isLastActiveAdmin())) {
    return { ok: false, error: "LAST_ADMIN" };
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath(USERS_PATH);
  return { ok: true };
}
