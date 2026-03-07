import { Home, Dumbbell, BarChart3, BookOpen, Layers, TrendingUp, LogOut, Camera, Gamepad2, Users, MessageSquare, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Training", url: "/training", icon: Dumbbell },
  { title: "Games", url: "/games", icon: Gamepad2 },
  { title: "Community", url: "/community", icon: Users },
  { title: "Stats", url: "/stats", icon: BarChart3 },
  { title: "Trick Library", url: "/tricks", icon: BookOpen },
  { title: "Sequence Builder", url: "/sequences", icon: Layers },
  { title: "Progression", url: "/progression", icon: TrendingUp },
  { title: "Height Challenge", url: "/height-challenge", icon: Camera },
  { title: "Pro Shop", url: "/shop", icon: ShoppingBag },
  { title: "Forum", url: "/forum", icon: MessageSquare },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">JJ</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm tracking-tight">Just Juggle</h2>
            <p className="text-xs text-muted-foreground">Personal Trainer</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    className="data-[active=true]:bg-sidebar-accent"
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter className="p-4">
          <Link href="/profile" data-testid="link-nav-profile" className="flex items-center gap-3 mb-3 hover-elevate rounded-md p-1 -m-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {user.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-username">{user.username}</p>
              <p className="text-xs text-muted-foreground">Level {user.level || 1}</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-2"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
