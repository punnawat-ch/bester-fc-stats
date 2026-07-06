"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, MoreVertical, Trash2, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmSheet } from "@/components/admin/ConfirmSheet";
import { deleteUser } from "./action";
import { userErrorMessage } from "./schema";
import { EditUserSheet } from "./edit-user-sheet";
import { ResetPasswordSheet } from "./reset-password-sheet";
import type { UserListItem } from "./types";

type UserActionsProps = Readonly<{
  user: UserListItem;
  currentUserId: string;
}>;

export function UserActions({ user, currentUserId }: UserActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  const isSelf = user.id === currentUserId;

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteUser(user.id);
      if (result.ok) {
        toast.success("User deleted");
        setDeleteOpen(false);
        return;
      }
      toast.error(userErrorMessage(result.error));
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${user.email}`}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <UserCog />
            Edit access
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setResetOpen(true)}>
            <KeyRound />
            Reset password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserSheet
        user={user}
        isSelf={isSelf}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ResetPasswordSheet
        user={user}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
      <ConfirmSheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${user.email}?`}
        description="This permanently removes the account. This action cannot be undone."
        confirmLabel="Delete user"
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
