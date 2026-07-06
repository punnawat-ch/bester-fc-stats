"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { RefreshCw, UserPlus } from "lucide-react";

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
  SheetTrigger,
} from "@/components/ui/sheet";
import { SubmitBar } from "@/components/admin/SubmitBar";
import { createUser } from "./action";
import { ROLES, createUserSchema, userErrorMessage } from "./schema";
import type { CreateUserInput } from "./schema";

const DEFAULT_VALUES: CreateUserInput = {
  email: "",
  name: "",
  role: "VIEWER",
  password: "",
};

function generatePassword(): string {
  return globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 14);
}

export function CreateUserSheet() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      form.reset(DEFAULT_VALUES);
    }
  }

  function onSubmit(values: CreateUserInput) {
    startTransition(async () => {
      const result = await createUser(values);
      if (result.ok) {
        toast.success("User invited");
        handleOpenChange(false);
        return;
      }
      toast.error(userErrorMessage(result.error));
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button data-tour="users-invite">
          <UserPlus />
          Invite
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92dvh]">
        <SheetHeader>
          <SheetTitle>Invite user</SheetTitle>
          <SheetDescription>
            Create an account and share the initial password with them.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 overflow-y-auto"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      placeholder="teammate@bester.fc"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Optional"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial password</FormLabel>
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
                    Share this with the new user — they can change it later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SubmitBar
              pending={pending}
              disabled={!form.formState.isDirty}
              saveLabel="Invite user"
              pendingLabel="Inviting…"
              onCancel={() => handleOpenChange(false)}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
