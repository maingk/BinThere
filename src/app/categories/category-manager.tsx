"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
  type ActionState,
} from "@/app/categories/actions";
import type { CategoryRow } from "@/lib/database.types";

type Row = CategoryRow & { toteCount: number };

const initial: ActionState = { error: null };

export function CategoryManager({ categories }: { categories: Row[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <NewCategoryForm />

      <ul className="divide-y rounded-lg border">
        {categories.map((category) =>
          editingId === category.id ? (
            <li key={category.id} className="p-3">
              <RenameForm
                category={category}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{category.name}</p>
                <p className="text-muted-foreground text-xs">
                  {category.toteCount}{" "}
                  {category.toteCount === 1 ? "tote" : "totes"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(category.id)}
                >
                  Rename
                </Button>
                <form action={deleteCategoryAction.bind(null, category.id)}>
                  <Button variant="ghost" size="sm" type="submit">
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ),
        )}
        {categories.length === 0 ? (
          <li className="text-muted-foreground p-6 text-center text-sm">
            No categories yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function NewCategoryForm() {
  const [state, formAction, pending] = useActionState(
    createCategoryAction,
    initial,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <Input
          name="name"
          required
          placeholder="New category…"
          className="flex-1"
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

function RenameForm({
  category,
  onDone,
}: {
  category: Row;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    renameCategoryAction.bind(null, category.id),
    initial,
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <Input
          name="name"
          defaultValue={category.name}
          required
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
    </form>
  );
}
