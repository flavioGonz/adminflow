import type { ReactNode } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout
      mainClassName="relative flex flex-1 flex-col gap-0 p-0 overflow-hidden min-h-0 bg-transparent"
    >
      {children}
    </DashboardLayout>
  );
}
