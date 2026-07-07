"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { SubmitBar } from "@/components/admin/SubmitBar";
import { updateUser } from "./action";
import { ROLES, userErrorMessage } from "./schema";
import type { UserListItem } from "./types";

type EditUserForm = Readonly<{
  role: Role;
  isActive: boolean;
}>;

type EditUserSheetProps = Readonly<{
  user: UserListItem;
  isSelf: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function EditUserSheet({
  user,
  isSelf,
  open,
  onOpenChange,
}: EditUserSheetProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<EditUserForm>({
    defaultValues: { role: user.role, isActive: user.isActive },
  });

  // Re-sync the form whenever the sheet is (re)opened for this user.
  useEffect(() => {
    if (open) {
      form.reset({ role: user.role, isActive: user.isActive });
    }
  }, [open, user.role, user.isActive, form]);

  function onSubmit(values: EditUserForm) {
    startTransition(async () => {
      const result = await updateUser({
        id: user.id,
        role: values.role,
        isActive: values.isActive,
      });
      if (result.ok) {
        toast.success("Access updated");
        onOpenChange(false);
        return;
      }
      toast.error(userErrorMessage(result.error));
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Edit access</SheetTitle>
          <SheetDescription>{user.email}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 overflow-y-auto"
          >
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSelf}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-glass p-4">
                  <div className="flex flex-col gap-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Inactive users cannot sign in.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSelf}
                      aria-label="Active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isSelf ? (
              <p className="text-sm text-fg-subtle">
                You cannot change your own role or status — ask another admin.
              </p>
            ) : null}

            <SubmitBar
              pending={pending}
              disabled={isSelf || !form.formState.isDirty}
              saveLabel="Save changes"
              pendingLabel="Saving…"
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
