"use client";

import { Topbar } from "@/components/admin/Topbar";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  // Login page gets no chrome
  if (isLogin) return <>{children}</>;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Topbar />
      <main className="admin-scrollable flex-1">{children}</main>
    </div>
  );
}
