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
import { mintCodesAction, type ActionState } from "@/app/labels/actions";

const initial: ActionState = { error: null };

export function LabelStudio({
  sheets,
  unclaimedCount,
  unclaimedCodes,
}: {
  sheets: { id: string; name: string }[];
  unclaimedCount: number;
  unclaimedCodes: string[];
}) {
  const [state, formAction, pending] = useActionState(mintCodesAction, initial);
  const [sheet, setSheet] = useState(sheets[0]?.id ?? "avery-22806");
  const [copies, setCopies] = useState("2");

  const printHref = `/api/labels?sheet=${sheet}&copies=${copies}`;
  const printAllHref =
    unclaimedCodes.length > 0
      ? `${printHref}&codes=${unclaimedCodes.join(",")}`
      : printHref;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-lg border p-5">
        <div className="space-y-1">
          <h2 className="font-medium">1. Generate blank codes</h2>
          <p className="text-muted-foreground text-sm">
            Each code is unique and permanent. Make a few more than you need.
          </p>
        </div>
        <form action={formAction} className="flex items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="count">How many</Label>
            <Input
              id="count"
              name="count"
              type="number"
              min={1}
              max={200}
              defaultValue={24}
              className="w-28"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Generating…" : "Generate"}
          </Button>
        </form>
        {state.error ? (
          <p className="text-destructive text-sm">{state.error}</p>
        ) : null}
        {state.minted ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Added {state.minted} blank codes.
          </p>
        ) : null}
        <p className="text-muted-foreground text-sm">
          {unclaimedCount} blank {unclaimedCount === 1 ? "code" : "codes"}{" "}
          waiting to be printed.
        </p>
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

        <Button asChild disabled={unclaimedCount === 0} className="w-full">
          <a href={printAllHref} target="_blank" rel="noopener noreferrer">
            {unclaimedCount === 0
              ? "Generate codes first"
              : `Open PDF — ${unclaimedCount} blank ${
                  unclaimedCount === 1 ? "label" : "labels"
                }`}
          </a>
        </Button>
      </section>

      {unclaimedCodes.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-medium">Blank codes</h2>
          <p className="text-muted-foreground font-mono text-xs break-all">
            {unclaimedCodes.join("  ·  ")}
          </p>
        </section>
      ) : null}
    </div>
  );
}
