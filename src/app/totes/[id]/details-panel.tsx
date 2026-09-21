"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToteForm } from "@/components/tote-form";
import {
  deleteToteAction,
  setToteStatusAction,
  updateToteAction,
} from "@/app/totes/actions";
import type { CategoryRow, ToteRow } from "@/lib/database.types";

export function ToteDetailsPanel({
  tote,
  categories,
}: {
  tote: ToteRow;
  categories: CategoryRow[];
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <section className="space-y-4">
      <Separator />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Tote details</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Close" : "Edit"}
        </Button>
      </div>

      {editing ? (
        <ToteForm
          action={updateToteAction.bind(null, tote.id)}
          categories={categories}
          tote={tote}
          submitLabel="Save changes"
          lockLabel
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <form
          action={setToteStatusAction.bind(
            null,
            tote.id,
            tote.status === "archived" ? "active" : "archived",
          )}
        >
          <Button type="submit" variant="outline" size="sm">
            {tote.status === "archived" ? "Restore tote" : "Archive tote"}
          </Button>
        </form>

        {confirmingDelete ? (
          <form
            action={deleteToteAction.bind(null, tote.id)}
            className="flex items-center gap-2"
          >
            <span className="text-muted-foreground text-sm">
              Delete this tote and its contents?
            </span>
            <Button type="submit" variant="destructive" size="sm">
              Delete
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingDelete(true)}
          >
            Delete tote
          </Button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Archiving keeps the tote and its label but hides it from the main list.
        Deleting frees the label number for reuse, which will clash with the
        sticker already on the tote — peel it off first.
      </p>
    </section>
  );
}
