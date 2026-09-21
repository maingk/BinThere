"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";

export function SearchBox({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [, startTransition] = useTransition();

  // Debounced so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === defaultValue) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(
          trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search",
        );
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [value, defaultValue, router]);

  return (
    <Input
      type="search"
      autoFocus
      placeholder="tree topper, cake stand, HDMI cable…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="h-12 text-base"
    />
  );
}
