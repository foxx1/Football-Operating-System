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
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { href: "/", icon: Gauge, label: "Dashboard", badge: null },
  { href: "/players", icon: Users, label: "Players", badge: "5" },
  { href: "/teams", icon: Shield, label: "Teams & Squads", badge: null },
  { href: "/staff", icon: UserCheck, label: "Staff Management", badge: null },
  { href: "/training", icon: Calendar, label: "Training Schedule", badge: null },
  { href: "/matches", icon: Trophy, label: "Matches", badge: null },
  { href: "/tactics", icon: Swords, label: "Tactics Board", badge: null },
  { href: "/analytics", icon: BarChart3, label: "Analytics", badge: null },
  { href: "/reports", icon: FileText, label: "Reports", badge: null },
  { href: "/settings", icon: Settings, label: "Settings", badge: null },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="bg-sidebar w-16 hover:w-60 transition-all duration-300 shadow-lg border-r border-sidebar-border flex flex-col group">
      {/* Logo Header */}
      <div className="px-3 py-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="text-primary-foreground text-lg" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
            <h1 className="text-xl font-bold text-sidebar-foreground">ProCoach</h1>
            <p className="text-sm text-sidebar-foreground/60">Team Management</p>
          </div>
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
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                  {item.label}
                </span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className="ml-auto bg-primary/10 text-primary hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    {item.badge}
                  </Badge>
                )}
                
                {/* Tooltip for collapsed state */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/item:opacity-100 group-hover:opacity-0 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-200">
                  {item.label}
                  {item.badge && <span className="ml-1 text-gray-300">({item.badge})</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
