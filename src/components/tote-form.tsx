"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SIZE_PREFIXES } from "@/lib/totes";
import type { ActionState } from "@/app/totes/actions";
import type { CategoryRow, ToteRow } from "@/lib/database.types";

const NO_CATEGORY = "__none__";
const initial: ActionState = { error: null };

export type BoundToteAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function ToteForm({
  action,
  categories,
  tote,
  submitLabel,
  suggestedIndex,
}: {
  action: BoundToteAction;
  categories: CategoryRow[];
  tote?: Pick<
    ToteRow,
    "size_prefix" | "index_no" | "name" | "category_id" | "description" | "location"
  >;
  submitLabel: string;
  /** Pre-fills the number field for a brand-new tote. */
  suggestedIndex?: number;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="size_prefix">Size</Label>
          <Select
            name="size_prefix"
            defaultValue={tote?.size_prefix ?? "M"}
            required
          >
            <SelectTrigger id="size_prefix" className="w-full">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {SIZE_PREFIXES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="index_no">Number</Label>
          <Input
            id="index_no"
            name="index_no"
            type="number"
            inputMode="numeric"
            min={1}
            required
            defaultValue={tote?.index_no ?? suggestedIndex ?? 1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Christmas lights &amp; garland"
          defaultValue={tote?.name ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Category</Label>
        <Select
          name="category_id"
          defaultValue={tote?.category_id ?? NO_CATEGORY}
        >
          <SelectTrigger id="category_id" className="w-full">
            <SelectValue placeholder="Uncategorized" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CATEGORY}>Uncategorized</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Where it lives</Label>
        <Input
          id="location"
          name="location"
          placeholder="Basement · rack 2 · top shelf"
          defaultValue={tote?.location ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Anything worth knowing before hauling it down."
          defaultValue={tote?.description ?? ""}
        />
      </div>

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
