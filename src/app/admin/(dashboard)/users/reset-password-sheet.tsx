"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SubmitBar } from "@/components/admin/SubmitBar";
import { resetPassword } from "./action";
import { userErrorMessage } from "./schema";
import type { UserListItem } from "./types";

const formSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password is too long"),
});

type ResetPasswordForm = z.input<typeof formSchema>;

const DEFAULT_VALUES: ResetPasswordForm = { password: "" };

function generatePassword(): string {
  return globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 14);
}

type ResetPasswordSheetProps = Readonly<{
  user: UserListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function ResetPasswordSheet({
  user,
  open,
  onOpenChange,
}: ResetPasswordSheetProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [open, form]);

  function onSubmit(values: ResetPasswordForm) {
    startTransition(async () => {
      const result = await resetPassword({ id: user.id, password: values.password });
      if (result.ok) {
        toast.success("Password reset");
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
          <SheetTitle>Reset password</SheetTitle>
          <SheetDescription>{user.email}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 overflow-y-auto"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="off"
                        placeholder="At least 8 characters"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label="Generate password"
                      onClick={() =>
                        form.setValue("password", generatePassword(), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <RefreshCw />
                    </Button>
                  </div>
                  <FormDescription>
                    Share the new password with the user securely.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SubmitBar
              pending={pending}
              disabled={!form.formState.isDirty}
              saveLabel="Reset password"
              pendingLabel="Resetting…"
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
