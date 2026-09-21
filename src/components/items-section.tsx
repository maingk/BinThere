"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addItemAction,
  deleteItemAction,
  updateItemAction,
  type ActionState,
} from "@/app/totes/actions";
import type { ItemRow } from "@/lib/database.types";

const initial: ActionState = { error: null };

export function ItemsSection({
  toteId,
  items,
}: {
  toteId: string;
  items: ItemRow[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-medium">Contents</h2>
        <span className="text-muted-foreground text-sm">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      <AddItemForm toteId={toteId} />

      {items.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id} className="p-3">
                <EditItemForm
                  item={item}
                  toteId={toteId}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {item.name}
                    {item.quantity > 1 ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        × {item.quantity}
                      </span>
                    ) : null}
                  </p>
                  {item.notes ? (
                    <p className="text-muted-foreground text-sm">
                      {item.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(item.id)}
                  >
                    Edit
                  </Button>
                  <form action={deleteItemAction.bind(null, item.id, toteId)}>
                    <Button variant="ghost" size="sm" type="submit">
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Nothing listed yet. Add the things you&apos;d actually go looking for.
        </p>
      )}
    </section>
  );
}

function AddItemForm({ toteId }: { toteId: string }) {
  const [state, formAction, pending] = useActionState(
    addItemAction.bind(null, toteId),
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Clear the row after a successful add so you can keep typing items.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <Input
          ref={nameRef}
          name="name"
          required
          placeholder="Add an item…"
          className="flex-1"
        />
        <Input
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          aria-label="Quantity"
          className="w-20"
        />
        <Button type="submit" disabled={pending}>
          Add
        </Button>
      </div>
      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
    </form>
  );
}

function EditItemForm({
  item,
  toteId,
  onDone,
}: {
  item: ItemRow;
  toteId: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateItemAction.bind(null, item.id, toteId),
    initial,
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`name-${item.id}`} className="text-xs">
            Item
          </Label>
          <Input id={`name-${item.id}`} name="name" defaultValue={item.name} required />
        </div>
        <div className="w-20 space-y-1">
          <Label htmlFor={`qty-${item.id}`} className="text-xs">
            Qty
          </Label>
          <Input
            id={`qty-${item.id}`}
            name="quantity"
            type="number"
            min={1}
            defaultValue={item.quantity}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`notes-${item.id}`} className="text-xs">
          Notes
        </Label>
        <Textarea
          id={`notes-${item.id}`}
          name="notes"
          rows={2}
          defaultValue={item.notes ?? ""}
        />
      </div>
      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
