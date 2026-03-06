"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, QrCode } from "lucide-react";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/clients", label: "Manajemen Klien", icon: QrCode },
  ];

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setUsername(d.username);
      })
      .catch(() => {});
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }, [router]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-accent" />
          <span className="text-base font-semibold text-accent">Gallery</span>
          <span className="text-sm text-muted">Admin</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-accent text-black"
                    : "text-muted hover:bg-surface-light hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {username && (
          <span className="flex items-center gap-1.5 text-sm text-foreground">
            <User className="h-4 w-4 text-muted" />
            {username}
          </span>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-light hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">
            {loggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </header>
  );
}
