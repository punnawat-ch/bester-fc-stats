"use client";

import { useEffect, useState, useTransition } from "react";
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
import { JerseyNumberField, NumberField } from "./number-field";
import { PlayerCardEditor } from "./player-card-editor";
import { PositionPills } from "./position-pills";
import { StatTileField, type StatFieldName, type StatTone } from "./stat-tile-field";
import { playerFormSchema, type PlayerFormValues } from "./schema";
import type { PlayerDTO } from "./types";

const EMPTY_VALUES: PlayerFormValues = {
  name: "",
  nickname: "",
  position: "",
  jerseyNumber: null,
  matchesPlayed: 0,
  goals: 0,
  assists: 0,
  cleanSheets: 0,
  yellowCards: 0,
  redCards: 0,
  motm: 0,
  saves: 0,
  sortOrder: 0,
};

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  NAME_TAKEN: "A player with this name already exists.",
  INVALID_INPUT: "Please check the form and try again.",
  NOT_FOUND: "That player no longer exists.",
};

type StatTileConfig = Readonly<{
  name: StatFieldName;
  label: string;
  tone: StatTone;
}>;

const STAT_TILES: readonly StatTileConfig[] = [
  { name: "goals", label: "Goals", tone: "emerald" },
  { name: "assists", label: "Assists", tone: "sky" },
  { name: "matchesPlayed", label: "Apps", tone: "neutral" },
  { name: "cleanSheets", label: "Clean sheets", tone: "emerald" },
  { name: "saves", label: "Saves", tone: "sky" },
  { name: "motm", label: "MOTM", tone: "amber" },
  { name: "yellowCards", label: "Yellow", tone: "amber" },
  { name: "redCards", label: "Red", tone: "rose" },
];

const CELEBRATE_CLOSE_MS = 700;

function toFormValues(player: PlayerDTO): PlayerFormValues {
  return {
    name: player.name,
    nickname: player.nickname ?? "",
    position: player.position ?? "",
    jerseyNumber: player.jerseyNumber,
    matchesPlayed: player.matchesPlayed,
    goals: player.goals,
    assists: player.assists,
    cleanSheets: player.cleanSheets,
    yellowCards: player.yellowCards,
    redCards: player.redCards,
    motm: player.motm,
    saves: player.saves,
    sortOrder: player.sortOrder,
  };
}

type SectionLabelProps = Readonly<{ children: string }>;

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">
      {children}
    </span>
  );
}

type PlayerFormSheetProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The player being edited, or `null` to create a new one. */
  player: PlayerDTO | null;
}>;

/**
 * Game-like "Player Card Editor" as a mobile bottom-sheet (admin-ux-spec §4.4):
 * a live front-card preview on top, colour pill position selector, and stat
 * stepper tiles, all RHF + Zod. Save is enabled whenever the form is valid (never
 * gated on `isDirty` — the photo persists via its own action, outside RHF), so a
 * photo change never leaves Save stuck. Field errors render inline; NAME_TAKEN
 * also sets an inline error on the name field.
 */
export function PlayerFormSheet({
  open,
  onOpenChange,
  player,
}: PlayerFormSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    player?.imageUrl ?? null,
  );
  const [photoChanged, setPhotoChanged] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onChange",
  });

  // Reset the RHF values (external store) whenever the sheet opens for a player.
  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset(player ? toFormValues(player) : EMPTY_VALUES);
    if (player) {
      // Existing values are valid — validate now so Save enables immediately.
      form.trigger().catch(() => {});
    }
  }, [open, player, form]);

  // Reset local editor UI state when the open target changes (render-phase sync,
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const instanceKey = open ? (player?.id ?? "new") : "closed";
  const [syncedKey, setSyncedKey] = useState(instanceKey);
  if (instanceKey !== syncedKey) {
    setSyncedKey(instanceKey);
    setPhotoUrl(player?.imageUrl ?? null);
    setPhotoChanged(false);
    setCelebrate(false);
  }

  const isEditing = player !== null;
  const { isValid, isDirty } = form.formState;
  const hasChanges = isDirty || photoChanged;

  function handlePhotoChange(url: string | null) {
    setPhotoUrl(url);
    setPhotoChanged(true);
  }

  function onSubmit(values: PlayerFormValues) {
    startTransition(async () => {
      const result = await upsertPlayer({ ...values, id: player?.id });
      if (result.ok) {
        toast.success(isEditing ? "Player updated" : "Player added");
        setCelebrate(true);
        globalThis.setTimeout(() => onOpenChange(false), CELEBRATE_CLOSE_MS);
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
      <SheetContent side="bottom" className="max-h-[94dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit player card" : "New player card"}</SheetTitle>
          <SheetDescription>
            Customise the card — stats are entered manually.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <PlayerCardEditor
              control={form.control}
              playerId={player?.id ?? null}
              photoUrl={photoUrl}
              celebrate={celebrate}
              onPhotoChange={handlePhotoChange}
            />

            <div className="flex flex-col gap-4">
              <SectionLabel>Identity</SectionLabel>
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

              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="Chai" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PositionPills control={form.control} />

              <div className="grid grid-cols-2 gap-4">
                <JerseyNumberField
                  control={form.control}
                  label="Jersey number"
                />
                <NumberField
                  control={form.control}
                  name="sortOrder"
                  label="Sort order"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SectionLabel>Match stats</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {STAT_TILES.map((tile) => (
                  <StatTileField
                    key={tile.name}
                    control={form.control}
                    name={tile.name}
                    label={tile.label}
                    tone={tile.tone}
                  />
                ))}
              </div>
            </div>

            {hasChanges ? (
              <p className="text-center text-xs text-white/50">Unsaved changes</p>
            ) : null}

            <SubmitBar
              pending={isPending}
              disabled={!isValid}
              saveLabel={isEditing ? "Save changes" : "Add player"}
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
