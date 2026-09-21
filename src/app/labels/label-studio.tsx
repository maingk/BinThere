"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mintLabelsAction, type ActionState } from "@/app/labels/actions";
import { SIZE_PREFIXES } from "@/lib/totes";

const initial: ActionState = { error: null };

export interface PendingRun {
  size: string;
  labels: string[];
}

export function LabelStudio({
  sheets,
  pending,
}: {
  sheets: { id: string; name: string }[];
  pending: PendingRun[];
}) {
  const [state, formAction, isMinting] = useActionState(
    mintLabelsAction,
    initial,
  );
  const [sheet, setSheet] = useState(sheets[0]?.id ?? "avery-22806");
  const [copies, setCopies] = useState("2");

  const totalPending = pending.reduce((sum, run) => sum + run.labels.length, 0);

  const printHref = (size?: string) => {
    const params = new URLSearchParams({ sheet, copies });
    if (size) params.set("size", size);
    return `/api/labels?${params}`;
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-lg border p-5">
        <div className="space-y-1">
          <h2 className="font-medium">1. Reserve labels</h2>
          <p className="text-muted-foreground text-sm">
            Numbering continues from your last tote of that size, so labels are
            never reused.
          </p>
        </div>
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="size_prefix">Size</Label>
            <Select name="size_prefix" defaultValue="27G">
              <SelectTrigger id="size_prefix" className="w-44">
                <SelectValue />
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
            <Label htmlFor="count">How many</Label>
            <Input
              id="count"
              name="count"
              type="number"
              min={1}
              max={200}
              defaultValue={12}
              className="w-24"
            />
          </div>
          <Button type="submit" disabled={isMinting}>
            {isMinting ? "Reserving…" : "Reserve"}
          </Button>
        </form>
        {state.error ? (
          <p className="text-destructive text-sm">{state.error}</p>
        ) : null}
        {state.minted?.length ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Reserved {state.minted[0]} – {state.minted[state.minted.length - 1]}
            .
          </p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-lg border p-5">
        <div className="space-y-1">
          <h2 className="font-medium">2. Print the sheet</h2>
          <p className="text-muted-foreground text-sm">
            Do one test print on plain paper and hold it against your label
            stock before printing on the real thing.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sheet">Label stock</Label>
            <Select value={sheet} onValueChange={setSheet}>
              <SelectTrigger id="sheet" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sheets.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="copies">Labels per tote</Label>
            <Select value={copies} onValueChange={setCopies}>
              <SelectTrigger id="copies" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — front only</SelectItem>
                <SelectItem value="2">2 — lid and front</SelectItem>
                <SelectItem value="3">3 — plus one spare</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {totalPending === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            No labels waiting to be printed. Reserve some above.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((run) => (
              <div
                key={run.size}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{run.size}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {run.labels[0]} – {run.labels[run.labels.length - 1]} (
                    {run.labels.length})
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <a
                    href={printHref(run.size)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Print
                  </a>
                </Button>
              </div>
            ))}
            <Button asChild className="w-full">
              <a
                href={printHref()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Print all {totalPending} labels
              </a>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
