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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { href: "/", icon: Gauge, label: "Dashboard", badge: null },
  { href: "/players", icon: Users, label: "Players", badge: "24" },
  { href: "/teams", icon: Shield, label: "Teams & Squads", badge: null },
  { href: "/training", icon: Calendar, label: "Training Schedule", badge: null },
  { href: "/tactics", icon: Swords, label: "Tactics Board", badge: null },
  { href: "/reports", icon: FileText, label: "Reports", badge: null },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="bg-sidebar w-72 shadow-lg border-r border-sidebar-border flex flex-col">
      {/* Logo Header */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">ProCoach</h1>
            <p className="text-sm text-sidebar-foreground/60">Team Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg transition-colors group sidebar-nav-item",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground active"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className="ml-auto bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" />
            <AvatarFallback>MT</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Marcus Thompson</p>
            <p className="text-xs text-sidebar-foreground/60">Head Coach</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
