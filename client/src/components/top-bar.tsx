import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, Bell, Moon, Sun, Settings, ChevronDown, Zap, Users, Shield, CalendarDays, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useSettings } from "@/contexts/SettingsContext";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout, useAuth, getRoleDisplayName } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

// ─── types ──────────────────────────────────────────────────────────────────

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  nationality?: string;
}

interface Team {
  id: number;
  name: string;
  category?: string;
}

interface TrainingSession {
  id: number;
  title: string;
  sessionType: string;
  date: string;
  location: string;
}

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: React.ElementType;
  category: "players" | "teams" | "sessions";
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesQuery(fields: string[], query: string) {
  const q = normalize(query);
  return fields.some((f) => normalize(f).includes(q));
}

// ─── GlobalSearch ─────────────────────────────────────────────────────────────

interface DropdownPos { top: number; left: number; width: number }

function GlobalSearch() {
  const { isRtl, t } = useI18n();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: players = [] } = useQuery<Player[]>({ queryKey: ["/api/players"], staleTime: 60_000 });
  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["/api/teams"], staleTime: 60_000 });
  const { data: sessions = [] } = useQuery<TrainingSession[]>({ queryKey: ["/api/training-sessions"], staleTime: 60_000 });

  const results: SearchResult[] = query.length >= 1
    ? [
        ...players
          .filter((p) => matchesQuery([p.firstName, p.lastName, p.position, p.nationality ?? ""], query))
          .slice(0, 4)
          .map((p) => ({
            id: `player-${p.id}`,
            label: `${p.firstName} ${p.lastName}`,
            sublabel: p.position,
            href: "/players",
            icon: Users,
            category: "players" as const,
          })),
        ...teams
          .filter((t) => matchesQuery([t.name, t.category ?? ""], query))
          .slice(0, 3)
          .map((t) => ({
            id: `team-${t.id}`,
            label: t.name,
            sublabel: t.category ?? "",
            href: "/teams",
            icon: Shield,
            category: "teams" as const,
          })),
        ...sessions
          .filter((s) => matchesQuery([s.title, s.sessionType, s.location], query))
          .slice(0, 3)
          .map((s) => ({
            id: `session-${s.id}`,
            label: s.title,
            sublabel: `${s.sessionType} · ${s.date}`,
            href: "/training",
            icon: CalendarDays,
            category: "sessions" as const,
          })),
      ]
    : [];

  // Close on outside click (check both the trigger wrapper and the portal dropdown)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inWrapper = wrapperRef.current?.contains(target) ?? false;
      const inDropdown = dropdownRef.current?.contains(target) ?? false;
      if (!inWrapper && !inDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Compute fixed position for the portal dropdown
  useLayoutEffect(() => {
    if (open && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: isRtl ? rect.right - Math.max(rect.width, 340) : rect.left,
        width: Math.max(rect.width, 340),
      });
    }
  }, [open, isRtl]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results.length]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectResult(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function selectResult(result: SearchResult) {
    navigate(result.href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function clearQuery() {
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  const categoryLabel: Record<string, string> = {
    players: t("topbar.search.players"),
    teams: t("topbar.search.teams"),
    sessions: t("topbar.search.sessions"),
  };

  // Group results by category for rendering
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const flatIndex = (category: string, indexInGroup: number) => {
    const cats = Object.keys(grouped);
    let offset = 0;
    for (const cat of cats) {
      if (cat === category) return offset + indexInGroup;
      offset += grouped[cat].length;
    }
    return offset + indexInGroup;
  };

  return (
    <div ref={wrapperRef} className="relative hidden lg:block">
      {/* Search icon / clear button */}
      {query.length > 0 ? (
        <button
          onClick={clearQuery}
          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${isRtl ? "right-3" : "left-3"}`}
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none ${isRtl ? "right-3" : "left-3"}`} />
      )}

      <Input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={t("topbar.search")}
        className={`py-2 w-80 bg-background/65 border-border/70 focus:bg-card ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(e.target.value.length >= 1);
        }}
        onFocus={() => {
          if (query.length >= 1) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {/* Dropdown — rendered via portal so it sits above all stacking contexts */}
      {open && dropdownPos && createPortal(
        <div
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
          }}
          ref={dropdownRef}
          className="rounded-lg border border-border/70 bg-card shadow-xl overflow-hidden"
        >
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t("topbar.search.noResults")}
            </div>
          ) : (
            <div className="py-1.5">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {categoryLabel[category] ?? category}
                  </p>
                  {items.map((result, idx) => {
                    const globalIdx = flatIndex(category, idx);
                    const Icon = result.icon;
                    const isActive = globalIdx === activeIndex;
                    return (
                      <button
                        key={result.id}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors ${
                          isActive
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-muted/60 text-foreground"
                        }`}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onMouseLeave={() => setActiveIndex(-1)}
                        onClick={() => selectResult(result)}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{result.label}</p>
                          {result.sublabel && (
                            <p className="truncate text-xs text-muted-foreground">{result.sublabel}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="border-t border-border/50 px-3 py-2 text-[11px] text-muted-foreground/60">
                {t("topbar.search.hint")}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── NotificationBell ───────────────────────────────────────────────────────

function NotificationBell() {
  const { isRtl, t, locale } = useI18n();
  const [, navigate] = useLocation();
  const dateLocale = locale === "ar" ? ar : enUS;

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  function handleSelect(notification: Notification) {
    if (!notification.isRead) markReadMutation.mutate(notification.id);
    if (notification.link) navigate(notification.link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0 rounded-sm"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>{t("topbar.notifications")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t("topbar.notifications.empty")}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleSelect(notification)}
                className={`flex flex-col items-start gap-0.5 whitespace-normal py-2.5 ${isRtl ? "text-right" : "text-left"} ${!notification.isRead ? "bg-primary/5" : ""}`}
              >
                <div className="flex w-full items-center gap-2">
                  {!notification.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  <p className="text-sm font-medium">{notification.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
                <p className="text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: dateLocale })}
                </p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { organizationName, logoUrl, currentSeason } = useSettings();
  const { isRtl, t, toggleLocale } = useI18n();
  const { user } = useAuth();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "U";

  return (
    <header className="border-b border-border/70 bg-card/80 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-5 min-w-0">
          {/* Organization Logo and Name */}
          <div className={`flex items-center min-w-0 ${isRtl ? "space-x-reverse space-x-3" : "space-x-3"}`}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${organizationName} Logo`}
                className="w-9 h-9 object-contain rounded-md bg-secondary/70 p-1"
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-extrabold leading-tight text-foreground text-balance">{organizationName}</h1>
              <span className="text-xs font-medium text-muted-foreground">
                {translateWithParams(t, "topbar.seasonCommand", { season: currentSeason })}
              </span>
            </div>
          </div>
        </div>

        <div className={`flex items-center ${isRtl ? "space-x-reverse space-x-3" : "space-x-3"}`}>
          {/* Global Search */}
          <GlobalSearch />

          {/* Notifications */}
          <NotificationBell />

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={toggleLocale} className="h-10 px-3">
            {t("topbar.language")}
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-auto px-2.5 py-2 hover:bg-secondary">
                <div className={`flex items-center ${isRtl ? "space-x-reverse space-x-3" : "space-x-3"}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div className={`hidden xl:flex flex-col ${isRtl ? "text-right" : "text-left"}`}>
                    <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
                    <span className="text-xs text-muted-foreground">{getRoleDisplayName(user?.role || "")}</span>
                  </div>
                  <ChevronDown className="hidden xl:block h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
                <span>{t("topbar.settings")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>{t("topbar.profile")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await logout();
                  queryClient.clear();
                  window.location.reload();
                }}
              >
                <span>{t("topbar.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
