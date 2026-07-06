"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PlayerDTO } from "./types";

type PlayerActionsProps = Readonly<{
  player: PlayerDTO;
  onEdit: (player: PlayerDTO) => void;
  onDelete: (player: PlayerDTO) => void;
}>;

/**
 * Row / card overflow menu (Edit + Delete). Only rendered when the caller has
 * `player:write` — VIEWER never sees it (admin-ux-spec §4.4 RBAC).
 */
export function PlayerActions({ player, onEdit, onDelete }: PlayerActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${player.name}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(player)}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(player)}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
