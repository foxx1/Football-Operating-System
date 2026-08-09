import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  Gauge, Users, Layers, Calendar, Grid2x2Check, 
  TrendingUp, FileText, User, Settings 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAuthState } from "@/lib/auth";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: Gauge, badge: null },
  { path: "/players", label: "Players", icon: Users, badge: "24" },
  { path: "/teams", label: "Teams & Squads", icon: Layers, badge: null },
  { path: "/training", label: "Training Schedule", icon: Calendar, badge: null },
  { path: "/tactics", label: "Tactics Board", icon: Grid2x2Check, badge: null },
  { path: "/analysis", label: "Match Analysis", icon: TrendingUp, badge: null },
  { path: "/reports", label: "Reports", icon: FileText, badge: null },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = getAuthState();

  return (
    <aside className="bg-white dark:bg-gray-900 w-72 shadow-lg border-r border-border flex flex-col">
      {/* Logo Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary-foreground"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">360FOS</h1>
            <p className="text-sm text-muted-foreground">Football Operating System</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.path || (item.path === "/dashboard" && location === "/");
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <a className={`sidebar-link ${isActive ? "active" : ""}`}>
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 cursor-pointer group">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.avatar || ""} alt={`${user?.firstName} ${user?.lastName}`} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role}
            </p>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </aside>
  );
}
