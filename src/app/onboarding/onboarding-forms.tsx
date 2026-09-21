"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  createHouseholdAction,
  joinHouseholdAction,
  type ActionState,
} from "@/app/onboarding/actions";

const initial: ActionState = { error: null };

export function OnboardingForms() {
  const [createState, createAction, creating] = useActionState(
    createHouseholdAction,
    initial,
  );
  const [joinState, joinAction, joining] = useActionState(
    joinHouseholdAction,
    initial,
  );

  return (
    <div className="space-y-6">
      <form action={createAction} className="space-y-4 rounded-lg border p-5">
        <div className="space-y-1">
          <h2 className="font-medium">Start a household</h2>
          <p className="text-muted-foreground text-sm">
            You&apos;ll get an invite code to share with your family.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="householdName">Household name</Label>
          <Input
            id="householdName"
            name="householdName"
            required
            placeholder="The Basement"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Your name</Label>
          <Input id="displayName" name="displayName" placeholder="Optional" />
        </div>
        {createState.error ? (
          <p className="text-destructive text-sm">{createState.error}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={creating}>
          {creating ? "Creating…" : "Create household"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs uppercase">or</span>
        <Separator className="flex-1" />
      </div>

      <form action={joinAction} className="space-y-4 rounded-lg border p-5">
        <div className="space-y-1">
          <h2 className="font-medium">Join a household</h2>
          <p className="text-muted-foreground text-sm">
            Paste the invite code from the person who set it up.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inviteCode">Invite code</Label>
          <Input
            id="inviteCode"
            name="inviteCode"
            required
            autoCapitalize="none"
            spellCheck={false}
            placeholder="a1b2c3d4e5f6"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="joinDisplayName">Your name</Label>
          <Input
            id="joinDisplayName"
            name="displayName"
            placeholder="Optional"
          />
        </div>
        {joinState.error ? (
          <p className="text-destructive text-sm">{joinState.error}</p>
        ) : null}
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={joining}
        >
          {joining ? "Joining…" : "Join household"}
        </Button>
      </form>
    </div>
  );
}
