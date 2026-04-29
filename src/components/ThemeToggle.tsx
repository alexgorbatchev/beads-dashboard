import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/appPrimitives";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
      <DropdownMenu>
        <DropdownMenuTrigger variant="toolbar" size="toolbar" title="Toggle theme">
        {resolvedTheme === "dark" ? (
          <Icon icon={Moon} tone="secondary" />
        ) : (
          <Icon icon={Sun} tone="secondary" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuPositioner align="end">
        <DropdownMenuContent width="compact">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            selected={theme === "light"}
          >
            <Icon icon={Sun} />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} selected={theme === "dark"}>
            <Icon icon={Moon} />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            selected={theme === "system"}
          >
            <Icon icon={Monitor} />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPositioner>
    </DropdownMenu>
  );
}
