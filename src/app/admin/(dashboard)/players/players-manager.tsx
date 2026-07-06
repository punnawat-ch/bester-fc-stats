"use client";

import { useState, useTransition } from "react";
import { Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { ConfirmSheet } from "@/components/admin/ConfirmSheet";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { ResponsiveList } from "@/components/admin/ResponsiveList";
import { Button } from "@/components/ui/button";
import { deletePlayer } from "./action";
import { PlayerCard } from "./player-card";
import { PlayerFormSheet } from "./player-form-sheet";
import { PlayerRowCells, PlayerTableHead } from "./player-row";
import type { PlayerDTO } from "./types";

type PlayersManagerProps = Readonly<{
  players: readonly PlayerDTO[];
  canWrite: boolean;
}>;

/**
 * Client owner of the Players screen: header + responsive card/table list plus
 * the create/edit sheet and delete confirm. All mutating affordances are gated
 * on `canWrite` (`player:write`), so a VIEWER gets a read-only list.
 */
export function PlayersManager({ players, canWrite }: PlayersManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerDTO | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<PlayerDTO | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(player: PlayerDTO) {
    setEditing(player);
    setFormOpen(true);
  }

  function openDelete(player: PlayerDTO) {
    setDeleting(player);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleting) {
      return;
    }
    startDelete(async () => {
      const result = await deletePlayer(deleting.id);
      if (result.ok) {
        toast.success("Player deleted");
        setDeleteOpen(false);
      } else {
        toast.error("Could not delete player.");
      }
    });
  }

  const addButton = canWrite ? (
    <Button type="button" onClick={openCreate} data-tour="players-add">
      <Plus />
      Player
    </Button>
  ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Manage"
        title="Players"
        count={players.length}
        actions={addButton}
        helpKey="players"
      />

      <ResponsiveList
        items={players}
        getKey={(player) => player.id}
        empty={
          <EmptyState
            icon={<UsersRound />}
            eyebrow="Squad"
            title="No players yet"
            description="Add your first player to build the squad list."
            action={
              canWrite ? (
                <Button type="button" onClick={openCreate}>
                  <Plus />
                  Add player
                </Button>
              ) : undefined
            }
          />
        }
        head={<PlayerTableHead canWrite={canWrite} />}
        renderRow={(player) => (
          <PlayerRowCells
            player={player}
            canWrite={canWrite}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        )}
        renderCard={(player) => (
          <PlayerCard
            player={player}
            canWrite={canWrite}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        )}
      />

      {canWrite ? (
        <PlayerFormSheet
          open={formOpen}
          onOpenChange={setFormOpen}
          player={editing}
        />
      ) : null}

      <ConfirmSheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${deleting?.name ?? "player"}?`}
        description="This action cannot be undone."
        confirmLabel="Delete player"
        pending={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
