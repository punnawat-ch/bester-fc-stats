"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SubmitBar } from "@/components/admin/SubmitBar";
import { upsertPlayer } from "./action";
import { NumberField } from "./number-field";
import { playerFormSchema, type PlayerFormValues } from "./schema";
import type { PlayerDTO } from "./types";

const EMPTY_VALUES: PlayerFormValues = {
  name: "",
  matchesPlayed: 0,
  goals: 0,
  assists: 0,
  cleanSheets: 0,
  sortOrder: 0,
};

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  NAME_TAKEN: "A player with this name already exists.",
  INVALID_INPUT: "Please check the form and try again.",
  NOT_FOUND: "That player no longer exists.",
};

function toFormValues(player: PlayerDTO): PlayerFormValues {
  return {
    name: player.name,
    matchesPlayed: player.matchesPlayed,
    goals: player.goals,
    assists: player.assists,
    cleanSheets: player.cleanSheets,
    sortOrder: player.sortOrder,
  };
}

type PlayerFormSheetProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The player being edited, or `null` to create a new one. */
  player: PlayerDTO | null;
}>;

/**
 * Create / edit form as a mobile bottom-sheet (admin-ux-spec §4.4). RHF + Zod,
 * single column, sticky SubmitBar. Server errors surface as a toast; NAME_TAKEN
 * also sets an inline error on the name field.
 */
export function PlayerFormSheet({
  open,
  onOpenChange,
  player,
}: PlayerFormSheetProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) {
      form.reset(player ? toFormValues(player) : EMPTY_VALUES);
    }
  }, [open, player, form]);

  const isEditing = player !== null;

  function onSubmit(values: PlayerFormValues) {
    startTransition(async () => {
      const result = await upsertPlayer({ ...values, id: player?.id });
      if (result.ok) {
        toast.success(isEditing ? "Player updated" : "Player added");
        onOpenChange(false);
        return;
      }

      const message =
        ERROR_MESSAGES[result.error ?? ""] ?? "Could not save player.";
      if (result.error === "NAME_TAKEN") {
        form.setError("name", { message });
      }
      toast.error(message);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit player" : "Add player"}</SheetTitle>
          <SheetDescription>
            Squad stats are entered manually.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Somchai P."
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                control={form.control}
                name="matchesPlayed"
                label="Matches played"
              />
              <NumberField
                control={form.control}
                name="goals"
                label="Goals"
              />
              <NumberField
                control={form.control}
                name="assists"
                label="Assists"
              />
              <NumberField
                control={form.control}
                name="cleanSheets"
                label="Clean sheets"
              />
              <NumberField
                control={form.control}
                name="sortOrder"
                label="Sort order"
              />
            </div>

            <SubmitBar
              pending={isPending}
              disabled={!form.formState.isDirty}
              saveLabel={isEditing ? "Save changes" : "Add player"}
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
