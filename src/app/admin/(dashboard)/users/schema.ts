import { z } from "zod";

/**
 * Zod schemas for the Users management feature (admin-ux-spec §4.7).
 * Shared by the guarded server actions (`action.ts`) and the client forms.
 * This module only depends on `zod`, so it is safe to import on both sides.
 */

export const ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

const roleSchema = z.enum(ROLES);

const emailSchema = z
  .email("Enter a valid email")
  .trim()
  .min(1, "Email is required")
  .max(200, "Email is too long");

const nameSchema = z.string().trim().max(120, "Name is too long").optional();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long");

const idSchema = z.string().min(1, "Missing user id");

export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  role: roleSchema,
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  id: idSchema,
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  id: idSchema,
  password: passwordSchema,
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

/** Typed error codes returned by the server actions. */
export type UserActionError =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "NOT_FOUND"
  | "EMAIL_TAKEN"
  | "SELF_FORBIDDEN"
  | "LAST_ADMIN";

const ERROR_MESSAGES: Record<UserActionError, string> = {
  UNAUTHENTICATED: "Your session expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to manage users.",
  VALIDATION: "Please check the form and try again.",
  NOT_FOUND: "That user no longer exists.",
  EMAIL_TAKEN: "A user with this email already exists.",
  SELF_FORBIDDEN: "You cannot deactivate, demote, or delete your own account.",
  LAST_ADMIN: "This is the last active admin — keep at least one to avoid a lockout.",
};

/** Map a server-action error code to a friendly, human message for toasts. */
export function userErrorMessage(error: string): string {
  return ERROR_MESSAGES[error as UserActionError] ?? "Something went wrong.";
}
