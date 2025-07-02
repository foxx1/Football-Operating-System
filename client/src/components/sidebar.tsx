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
  LayoutGrid
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
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M16 10l3-1.5v5L16 12V10z"/>
      <path d="M19 9l2-1v4l-2-1V9z"/>
      <path d="M8 12l-3 1.5v-5L8 10v2z"/>
      <path d="M5 11l-2 1V8l2 1v2z"/>
    </g>
  </svg>
);
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const navigationItems = [
  { href: "/", icon: Gauge, label: "Dashboard", badge: null },
  { href: "/players", icon: Users, label: "Players", badge: "5" },
  { href: "/teams", icon: Shield, label: "Teams & Squads", badge: null },
  { href: "/staff", icon: UserCheck, label: "Staff Management", badge: null },
  { href: "/training", icon: Calendar, label: "Training Schedule", badge: null },
  { href: "/matches", icon: Trophy, label: "Matches", badge: null },
  { href: "/tactics", icon: Swords, label: "Tactics Board", badge: null },
  { href: "/tactical-board", icon: LayoutGrid, label: "Interactive Board", badge: "NEW" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", badge: null },
  { href: "/performance-reactions", icon: Smile, label: "Performance Reactions", badge: "NEW" },
  { href: "/wearables", icon: Activity, label: "Wearable Devices", badge: null },
  { href: "/catapult-openfield", icon: CatapultIcon, label: "CATAPULT-OpenField", badge: "NEW" },
  { href: "/monthly-budgets", icon: Wallet, label: "Monthly Budgets", badge: null },
  { href: "/reports", icon: FileText, label: "Reports", badge: null },
  { href: "/settings", icon: Settings, label: "Settings", badge: null },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { organizationName, logoUrl } = useSettings();

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

  return (
    <aside className={cn(
      "bg-sidebar shadow-lg border-r border-sidebar-border flex flex-col transition-all duration-300",
      isExpanded ? "w-60" : "w-16 hover:w-60 group"
    )}>
      {/* Logo Header */}
      <div className="px-3 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${organizationName} Logo`}
                  className="w-8 h-8 object-contain rounded"
                />
              ) : (
                <Zap className="text-primary-foreground text-lg" />
              )}
            </div>
            <div className={cn(
              "overflow-hidden whitespace-nowrap transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <h1 className="text-xl font-bold text-sidebar-foreground">{organizationName}</h1>
              <p className="text-sm text-sidebar-foreground/60">Team Management</p>
            </div>
          </div>
          
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-opacity duration-300",
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
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg transition-all duration-300 group/item cursor-pointer relative",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground active"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(
                  "font-medium ml-3 overflow-hidden whitespace-nowrap transition-opacity duration-300",
                  isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {item.label}
                </span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-auto bg-primary/10 text-primary hover:bg-primary/20 transition-opacity duration-300",
                      isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/item:opacity-100 group-hover:opacity-0 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200">
                    {item.label}
                    {item.badge && <span className="ml-1 text-gray-300">({item.badge})</span>}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
