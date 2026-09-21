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
import { SIZE_PREFIXES, formatToteLabel, type ToteLabelParts } from "@/lib/totes";
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
  lockLabel = false,
}: {
  action: BoundToteAction;
  categories: CategoryRow[];
  tote?: Partial<ToteLabelParts> &
    Partial<Pick<ToteRow, "name" | "category_id" | "description" | "location">>;
  submitLabel: string;
  /**
   * True once a sticker exists for this tote. Size and number are then fixed
   * — the label is already on the lid — so we show them instead of editing.
   */
  lockLabel?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  const printed =
    tote?.size_prefix != null && tote?.index_no != null
      ? formatToteLabel({
          size_prefix: tote.size_prefix,
          index_no: tote.index_no,
        })
      : null;

  return (
    <form action={formAction} className="space-y-5">
      {lockLabel ? (
        printed ? (
          <div className="bg-muted/40 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Printed label</p>
            <p className="font-mono text-lg font-medium">{printed}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Fixed — this is what the sticker says.
            </p>
          </div>
        ) : null
      ) : (
        <div className="space-y-2">
          <Label htmlFor="size_prefix">Tote size</Label>
          <Select name="size_prefix" defaultValue="27G" required>
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
          <p className="text-muted-foreground text-xs">
            The number is assigned automatically, continuing from your last
            tote of this size.
          </p>
        </div>
      )}

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
          placeholder="Level A · rack 2 · top shelf"
          defaultValue={tote?.location ?? ""}
        />
        <p className="text-muted-foreground text-xs">
          Not printed on the label, so you can move the tote without
          re-stickering it.
        </p>
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
