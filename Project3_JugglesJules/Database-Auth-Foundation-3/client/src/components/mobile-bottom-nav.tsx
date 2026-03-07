import { Home, Dumbbell, BookOpen, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
    { title: "Home", url: "/", icon: Home },
    { title: "Train", url: "/training", icon: Dumbbell },
    { title: "Tricks", url: "/tricks", icon: BookOpen },
    { title: "Profile", url: "/profile", icon: User },
];

export function MobileBottomNav() {
    const [location] = useLocation();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex items-center justify-around px-2 z-50">
            {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                    <Link key={item.title} href={item.url}>
                        <div className={cn(
                            "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                            <item.icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium">{item.title}</span>
                        </div>
                    </Link>
                );
            })}
        </nav>
    );
}
