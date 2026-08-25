"use client";

import { useEffect, useState } from "react";
import { applyTheme, loadTheme, saveTheme, type Theme } from "@/lib/theme";
import { useMessages } from "@/lib/i18n";
import { IconButton } from "./ui/IconButton";
import { IconMoon, IconSun } from "./ui/icons";

export function ThemeToggle() {
  const messages = useMessages();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Deferred on purpose: the theme is only known once the blocking init
    // script (see THEME_INIT_SCRIPT) has run on the client, so the first
    // render must match the server-rendered default before syncing in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(loadTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    saveTheme(next);
  }

  return (
    <IconButton
      onClick={toggle}
      aria-label={
        theme === "light"
          ? messages.header.toDarkTheme
          : messages.header.toLightTheme
      }
    >
      {theme === "light" ? <IconMoon size={22} /> : <IconSun size={22} />}
    </IconButton>
  );
}
