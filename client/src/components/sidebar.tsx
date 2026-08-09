import { Link, useLocation } from "wouter";
import {
  Gauge,
  Users,
  Shield,
  Calendar,
  Swords,
  TrendingUp,
  FileText,
  Settings,
  Zap,
  UserCheck,
  Trophy,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Target,
  Wallet,
  Smile,
  LayoutGrid,
  MousePointer2,
  Award,
  UserCog,
  HeartPulse,
  ChevronDown,
  List,
  PlusCircle,
  ClipboardList,
  Stethoscope,
  ListChecks,
} from "lucide-react";

// Custom Catapult Icon Component
const CatapultIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="currentColor">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M16 10l3-1.5v5L16 12V10z" />
      <path d="M19 9l2-1v4l-2-1V9z" />
      <path d="M8 12l-3 1.5v-5L8 10v2z" />
      <path d="M5 11l-2 1V8l2 1v2z" />
    </g>
  </svg>
);
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, type ComponentType } from "react";
import { isTechnicalStaffRole } from "@shared/schema";

type IconType = ComponentType<{ className?: string }>;

interface NavSubItem {
  href: string;
  icon: IconType;
  labelKey: string;
}

interface NavLinkItem {
  href: string;
  icon: IconType;
  labelKey: string;
  badge: string | null;
  superAdminOnly?: boolean;
}

interface NavExpandableItem {
  type: "expandable";
  icon: IconType;
  labelKey: string;
  badge: string | null;
  rootPath: string;
  subItems: NavSubItem[];
}

type NavItem = NavLinkItem | NavExpandableItem;

// Injury sub-menu items
const injurySubItems: NavSubItem[] = [
  { href: "/injuries", icon: List, labelKey: "nav.injuryList" },
  { href: "/injuries/add", icon: PlusCircle, labelKey: "nav.addInjury" },
  { href: "/injuries/report", icon: ClipboardList, labelKey: "nav.injuryReport" },
  { href: "/injuries/manage", icon: Stethoscope, labelKey: "nav.injuryManagement" },
];

// Training sub-menu items
const trainingSubItems: NavSubItem[] = [
  { href: "/training", icon: Calendar, labelKey: "nav.trainingSessions" },
  { href: "/training/attendance", icon: ListChecks, labelKey: "nav.trainingAttendance" },
];

const navigationItems: NavItem[] = [
  { href: "/", icon: Gauge, labelKey: "nav.dashboard", badge: null },
  { href: "/players", icon: Users, labelKey: "nav.players", badge: "5" },
  { href: "/teams", icon: Shield, labelKey: "nav.teams", badge: null },
  { href: "/staff", icon: UserCheck, labelKey: "nav.staff", badge: null },
  { type: "expandable", icon: Calendar, labelKey: "nav.training", badge: null, rootPath: "/training", subItems: trainingSubItems },
  { href: "/matches", icon: Trophy, labelKey: "nav.matches", badge: null },
  { href: "/interactive-tactical-board", icon: Target, labelKey: "nav.interactiveBoard", badge: "new" },
  { href: "/analytics", icon: BarChart3, labelKey: "nav.analytics", badge: null },
  { href: "/achievements", icon: Award, labelKey: "nav.achievements", badge: "new" },
  { href: "/performance-reactions", icon: Smile, labelKey: "nav.performanceReactions", badge: "new" },
  { href: "/wearables", icon: Activity, labelKey: "nav.wearables", badge: null },
  { href: "/catapult-openfield", icon: CatapultIcon, labelKey: "nav.catapult", badge: "new" },
  { type: "expandable", icon: HeartPulse, labelKey: "nav.injuries", badge: "new", rootPath: "/injuries", subItems: injurySubItems },
  { href: "/monthly-budgets", icon: Wallet, labelKey: "nav.monthlyBudgets", badge: null },
  { href: "/year-budgets", icon: Wallet, labelKey: "nav.yearBudgets", badge: null },
  { href: "/reports", icon: FileText, labelKey: "nav.reports", badge: null },
  { href: "/settings", icon: Settings, labelKey: "nav.settings", badge: null },
  { href: "/user-control", icon: UserCog, labelKey: "nav.userControl", badge: null, superAdminOnly: true },
];

// Every technical staffer can review injuries; only medical staff
// (physiotherapist) gets to record new ones and run the treatment tracker.
function getTechnicalInjurySubItems(isMedicalStaff: boolean): NavSubItem[] {
  const items: NavSubItem[] = [
    { href: "/injuries", icon: List, labelKey: "nav.injuryList" },
    { href: "/injuries/report", icon: ClipboardList, labelKey: "nav.injuryReport" },
  ];
  if (isMedicalStaff) {
    items.splice(1, 0, { href: "/injuries/add", icon: PlusCircle, labelKey: "nav.addInjury" });
    items.push({ href: "/injuries/manage", icon: Stethoscope, labelKey: "nav.injuryManagement" });
  }
  return items;
}

function getTechnicalNavigationItems(isMedicalStaff: boolean): NavItem[] {
  return [
    { href: "/technical-staff", icon: Gauge, labelKey: "nav.dashboard", badge: null },
    { href: "/players", icon: Users, labelKey: "nav.players", badge: null },
    { type: "expandable", icon: Calendar, labelKey: "nav.training", badge: null, rootPath: "/training", subItems: trainingSubItems },
    { href: "/matches", icon: Trophy, labelKey: "nav.matches", badge: null },
    { href: "/analytics", icon: BarChart3, labelKey: "nav.analytics", badge: null },
    { href: "/catapult-openfield", icon: CatapultIcon, labelKey: "nav.catapult", badge: null },
    { type: "expandable", icon: HeartPulse, labelKey: "nav.injuries", badge: null, rootPath: "/injuries", subItems: getTechnicalInjurySubItems(isMedicalStaff) },
    { href: "/achievements", icon: Award, labelKey: "nav.achievements", badge: null },
    { href: "/interactive-tactical-board", icon: Target, labelKey: "nav.interactiveBoard", badge: null },
  ];
}

export default function Sidebar() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { organizationName, logoUrl } = useSettings();
  const { isRtl, t } = useI18n();
  const { permissions, user } = useAuth();
  const isTechnicalUser = isTechnicalStaffRole(user?.role);
  const technicalNavigationItems = getTechnicalNavigationItems(user?.role === "physiotherapist");
  const playerNavigationItems = [
    { href: "/training", icon: Calendar, labelKey: "nav.training", badge: "2" },
    { href: "/matches", icon: Trophy, labelKey: "nav.matches", badge: null },
    { href: "/analytics", icon: BarChart3, labelKey: "nav.analytics", badge: null },
    { href: "/achievements", icon: Award, labelKey: "nav.achievements", badge: "new" },
  ];

  // Load sidebar preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('sidebar-expanded');
    if (savedPreference !== null) {
      setIsExpanded(JSON.parse(savedPreference));
    }
  }, []);

  // Save sidebar preference to localStorage
  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebar-expanded', JSON.stringify(newState));
  };

  // Toggle expandable sub-menu
  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };


  return (
    <aside className={cn(
      "relative bg-sidebar hidden md:flex flex-col min-h-0 transition-all duration-300 shadow-[18px_0_50px_-40px_hsl(var(--sidebar-background)/0.8)]",
      isRtl ? "border-l border-sidebar-border order-last" : "border-r border-sidebar-border order-first",
      "before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_top_left,hsl(var(--sidebar-primary)/0.18),transparent_18rem)]",
      isExpanded ? "w-64" : "w-20 hover:w-64 group"
    )}>
      {/* Logo Header */}
      <div className="relative px-3 py-4 border-b border-sidebar-border/80">
        <div className="flex items-center justify-between gap-2">
          <Link href={user?.role === "player" ? "/player-dashboard" : isTechnicalUser ? "/technical-staff" : "/"}>
            <div className={cn("flex items-center cursor-pointer", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
              <div className="w-11 h-11 bg-sidebar-primary text-sidebar-primary-foreground rounded-md flex items-center justify-center flex-shrink-0 shadow-[0_16px_26px_-18px_hsl(var(--sidebar-primary)/0.9)]">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${organizationName} Logo`}
                    className="w-8 h-8 object-contain rounded-sm"
                  />
                ) : (
                  <Zap className="text-primary-foreground text-lg" />
                )}
              </div>
              <div className={cn(
                "overflow-hidden whitespace-nowrap transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <h1 className="text-lg font-bold leading-tight text-sidebar-foreground">{organizationName}</h1>
                <p className="text-xs font-medium text-sidebar-foreground/75">{t("app.subtitle")}</p>
              </div>
            </div>
          </Link>

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "h-8 w-8 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            {isExpanded ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      {/*
        To ensure the scrollbar appears on the right in RTL mode we force the scroll container
        itself to `direction: ltr` while keeping the inner content direction controlled by `dir`.
        This keeps the scrollbar on the right without changing item alignment.
      */}
      <nav style={isRtl ? { direction: 'ltr' } : undefined} className="relative flex-1 overflow-y-auto min-h-0">
        <div className="relative px-3 py-4 space-y-1 overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
          {user?.role === "player" && (
            <p className={cn(
              "mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45 transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              {t("nav.playerSpace")}
            </p>
          )}
          {isTechnicalUser && (
            <p className={cn(
              "mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45 transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              {t("nav.technicalWorkspace")}
            </p>
          )}
          {(user?.role === "player"
            ? playerNavigationItems
            : isTechnicalUser
              ? technicalNavigationItems
            : navigationItems.filter((item) => !("superAdminOnly" in item && item.superAdminOnly) || permissions.canManageRoles)
          ).map((item) => {
            const Icon = item.icon;

            // Expandable menu item (e.g., Injuries, Training)
            if ("type" in item && item.type === "expandable" && "subItems" in item) {
              const menuKey = item.labelKey;
              const isRouteActive = "rootPath" in item && location.startsWith(item.rootPath);
              const isMenuOpen = expandedMenus[menuKey] || isRouteActive;

              return (
                <div key={menuKey}>
                  {/* Parent menu item */}
                  <div
                    onClick={() => toggleMenu(menuKey)}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-md transition-all duration-200 group/item cursor-pointer relative",
                      isRouteActive
                        ? "bg-sidebar-primary/10 text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={cn(
                      "font-medium overflow-hidden whitespace-nowrap transition-opacity duration-300",
                      isRtl ? "mr-3" : "ml-3",
                      isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {t(item.labelKey)}
                    </span>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-sm border border-sidebar-primary/25 bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20 transition-opacity duration-300",
                          isRtl ? "mr-auto" : "ml-auto",
                          isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {item.badge === "new" ? t("badge.new") : item.badge}
                      </Badge>
                    )}
                    <ChevronDown className={cn(
                      "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                      isRtl ? "mr-auto" : "ml-auto",
                      isMenuOpen && "rotate-180",
                      isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )} />

                    {/* Tooltip for collapsed state */}
                    {!isExpanded && (
                      <div className={cn(
                        "absolute px-2.5 py-1.5 bg-sidebar text-sidebar-foreground text-xs rounded-md opacity-0 group-hover/item:opacity-100 group-hover:opacity-0 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 shadow-xl border border-sidebar-border",
                        isRtl ? "right-full mr-2" : "left-full ml-2",
                      )}>
                        {t(item.labelKey)}
                      </div>
                    )}
                  </div>

                  {/* Sub-menu items */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isMenuOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className={cn("space-y-0.5 pt-1", isRtl ? "pr-4" : "pl-4")}>
                      {item.subItems.map((subItem) => {
                        const isSubActive = location === subItem.href;
                        const SubIcon = subItem.icon;

                        return (
                          <Link key={subItem.href} href={subItem.href}>
                            <div
                              className={cn(
                                "flex items-center px-3 py-2 rounded-md transition-all duration-200 group/subitem cursor-pointer relative",
                                isSubActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_14px_26px_-20px_hsl(var(--sidebar-primary)/0.9)]"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <SubIcon className="w-4 h-4 flex-shrink-0" />
                              <span className={cn(
                                "text-sm font-medium overflow-hidden whitespace-nowrap transition-opacity duration-300",
                                isRtl ? "mr-2.5" : "ml-2.5",
                                isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}>
                                {t(subItem.labelKey)}
                              </span>

                              {/* Tooltip for collapsed state */}
                              {!isExpanded && (
                                <div className={cn(
                                  "absolute px-2.5 py-1.5 bg-sidebar text-sidebar-foreground text-xs rounded-md opacity-0 group-hover/subitem:opacity-100 group-hover:opacity-0 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 shadow-xl border border-sidebar-border",
                                  isRtl ? "right-full mr-2" : "left-full ml-2",
                                )}>
                                  {t(subItem.labelKey)}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // Regular menu item
            const isActive = "href" in item && location === item.href;

            return (
              <Link key={"href" in item ? item.href : item.labelKey} href={"href" in item ? item.href : "/"}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-md transition-all duration-200 group/item cursor-pointer relative",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_14px_26px_-20px_hsl(var(--sidebar-primary)/0.9)]"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={cn(
                    "font-medium overflow-hidden whitespace-nowrap transition-opacity duration-300",
                    isRtl ? "mr-3" : "ml-3",
                    isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    {t(item.labelKey)}
                  </span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-auto rounded-sm border border-sidebar-primary/25 bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20 transition-opacity duration-300",
                        isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {item.badge === "new" ? t("badge.new") : item.badge}
                    </Badge>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className={cn(
                      "absolute px-2.5 py-1.5 bg-sidebar text-sidebar-foreground text-xs rounded-md opacity-0 group-hover/item:opacity-100 group-hover:opacity-0 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200 shadow-xl border border-sidebar-border",
                      isRtl ? "right-full mr-2" : "left-full ml-2",
                    )}>
                      {t(item.labelKey)}
                      {item.badge && <span className={cn("text-gray-300", isRtl ? "mr-1" : "ml-1")}>({item.badge === "new" ? t("badge.new") : item.badge})</span>}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>


    </aside>
  );
}
