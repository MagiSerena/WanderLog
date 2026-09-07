"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Plane, Receipt, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Trips", path: "/", icon: Plane },
    { name: "Log", path: "/log", icon: PlusCircle, isMain: true },
    { name: "Map", path: "/map", icon: Map },
    { name: "Expenses", path: "/expenses", icon: Receipt },
    { name: "Profile", path: "/profile", icon: User },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 px-4 pb-safe bg-background/80 backdrop-blur-lg border-t border-border sm:hidden">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));

                return (
                    <Link
                        key={item.name}
                        href={item.path}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs",
                            isActive ? "text-primary font-semibold" : "text-muted-foreground",
                            item.isMain && "text-primary"
                        )}
                    >
                        {item.isMain ? (
                            <div className="absolute -top-6 p-3 rounded-full bg-primary text-primary-foreground shadow-lg transform transition-transform hover:scale-105 active:scale-95">
                                <Icon className="w-6 h-6" />
                            </div>
                        ) : (
                            <Icon className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className={cn(item.isMain && "sr-only", "mt-1")}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
