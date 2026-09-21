"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupToteAction, type ActionState } from "@/app/totes/actions";

const initial: ActionState = { error: null };

/**
 * Types-the-label fallback for when scanning isn't an option — a cracked
 * sticker, a phone with no camera to hand, or a QR that won't read.
 */
export function ToteLookup() {
  const [state, formAction, pending] = useActionState(lookupToteAction, initial);

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex gap-2">
        <Input
          name="label"
          placeholder="17G-01"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label="Tote label from the sticker"
          className="flex-1 font-mono"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Finding…" : "Go"}
        </Button>
      </form>
      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
    </div>
  );
}
