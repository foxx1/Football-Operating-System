import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Gauge, Users, Calendar, Trophy, BarChart3,
  HeartPulse, Award, Settings, Shield, UserCheck,
  FileText, Wallet, Target, LayoutGrid, X, Activity,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/contexts/I18nContext";
import { isTechnicalStaffRole } from "@shared/schema";

interface MobileNavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const staffMain: MobileNavItem[] = [
  { href: "/",        icon: Gauge,    labelKey: "nav.dashboard" },
  { href: "/players", icon: Users,    labelKey: "nav.players"   },
  { href: "/training",icon: Calendar, labelKey: "nav.training"  },
  { href: "/matches", icon: Trophy,   labelKey: "nav.matches"   },
];

const staffMore: MobileNavItem[] = [
  { href: "/teams",            icon: Shield,    labelKey: "nav.teams"           },
  { href: "/staff",            icon: UserCheck, labelKey: "nav.staff"           },
  { href: "/analytics",        icon: BarChart3, labelKey: "nav.analytics"       },
  { href: "/injuries",         icon: HeartPulse,labelKey: "nav.injuries"        },
  { href: "/achievements",     icon: Award,     labelKey: "nav.achievements"    },
  { href: "/monthly-budgets",  icon: Wallet,    labelKey: "nav.monthlyBudgets"  },
  { href: "/reports",          icon: FileText,  labelKey: "nav.reports"         },
  { href: "/wearables",        icon: Activity,  labelKey: "nav.wearables"       },
  { href: "/interactive-tactical-board", icon: Target, labelKey: "nav.interactiveBoard" },
  { href: "/settings",         icon: Settings,  labelKey: "nav.settings"        },
  { href: "/user-control",     icon: UserCog,   labelKey: "nav.userControl"     },
];

const technicalMain: MobileNavItem[] = [
  { href: "/technical-staff", icon: Gauge,     labelKey: "nav.dashboard" },
  { href: "/training",        icon: Calendar,  labelKey: "nav.training"  },
  { href: "/injuries",        icon: HeartPulse,labelKey: "nav.injuries"  },
  { href: "/matches",         icon: Trophy,    labelKey: "nav.matches"   },
];

const technicalMore: MobileNavItem[] = [
  { href: "/players",       icon: Users,    labelKey: "nav.players"         },
  { href: "/analytics",     icon: BarChart3,labelKey: "nav.analytics"       },
  { href: "/achievements",  icon: Award,    labelKey: "nav.achievements"    },
  { href: "/interactive-tactical-board", icon: Target, labelKey: "nav.interactiveBoard" },
];

const playerMain: MobileNavItem[] = [
  { href: "/player-dashboard", icon: Gauge,    labelKey: "nav.dashboard"    },
  { href: "/training",         icon: Calendar, labelKey: "nav.training"     },
  { href: "/matches",          icon: Trophy,   labelKey: "nav.matches"      },
  { href: "/analytics",        icon: BarChart3,labelKey: "nav.analytics"    },
  { href: "/achievements",     icon: Award,    labelKey: "nav.achievements" },
];

function NavBtn({ item, isActive, onClick }: {
  item: MobileNavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const { t } = useI18n();
  const Icon = item.icon;

  return (
    <Link href={item.href} onClick={onClick}>
      <button
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 w-full h-full px-1 transition-colors",
          isActive
            ? "text-[hsl(var(--sidebar-primary))]"
            : "text-[hsl(var(--sidebar-foreground)/0.55)] hover:text-[hsl(var(--sidebar-foreground))]",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="text-[9px] font-medium leading-none tracking-wide truncate max-w-[52px]">
          {t(item.labelKey)}
        </span>
      </button>
    </Link>
  );
}

export default function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { isRtl, t } = useI18n();

  const isPlayer = user?.role === "player";
  const isTechnical = isTechnicalStaffRole(user?.role);
  const isSuperAdmin = user?.role === "club_super_admin";

  const mainItems = isPlayer ? playerMain : isTechnical ? technicalMain : staffMain;
  const rawMore = isPlayer ? [] : isTechnical ? technicalMore : staffMore;
  const moreItems = rawMore.filter(
    item => item.href !== "/user-control" || isSuperAdmin,
  );
  const hasMore = moreItems.length > 0;

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/technical-staff") return location === "/technical-staff";
    if (href === "/player-dashboard") return location === "/player-dashboard";
    return location.startsWith(href);
  };

  const moreItemsActive = hasMore && moreItems.some(i => isActive(i.href));

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="flex items-stretch justify-around h-16">
          {mainItems.map(item => (
            <div key={item.href} className="flex-1 flex items-stretch">
              <NavBtn item={item} isActive={isActive(item.href)} />
            </div>
          ))}

          {hasMore && (
            <div className="flex-1 flex items-stretch">
              <button
                onClick={() => setMoreOpen(true)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-full h-full px-1 transition-colors",
                  moreItemsActive || moreOpen
                    ? "text-[hsl(var(--sidebar-primary))]"
                    : "text-[hsl(var(--sidebar-foreground)/0.55)] hover:text-[hsl(var(--sidebar-foreground))]",
                )}
              >
                <LayoutGrid className="h-5 w-5 shrink-0" />
                <span className="text-[9px] font-medium leading-none tracking-wide">More</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-border">
              <span className="text-sm font-semibold text-foreground">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {moreItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}>
                    <button
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 w-full transition-colors",
                        active
                          ? "bg-[hsl(var(--sidebar-primary)/0.12)] text-[hsl(var(--sidebar-primary))]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-[9px] font-medium leading-none text-center line-clamp-2">
                        {t(item.labelKey)}
                      </span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
