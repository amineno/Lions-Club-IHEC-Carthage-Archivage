"use client";

import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import ReadonlyBanner from "./ReadonlyBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="app-shell">
      <Topbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <div className="layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="main-content">
          <ReadonlyBanner />
          {children}
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}
