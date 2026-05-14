"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

export function ColorModeSwitcher() {
  const { setTheme } = useTheme();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("dark")}
        className="dark:hidden"
        aria-label="Switch to dark mode"
      >
        <Moon />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("light")}
        className="hidden dark:flex"
        aria-label="Switch to light mode"
      >
        <Sun />
      </Button>
    </>
  );
}
