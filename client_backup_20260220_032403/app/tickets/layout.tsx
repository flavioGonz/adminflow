import DashboardLayout from "@/components/layout/dashboard-layout";

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}