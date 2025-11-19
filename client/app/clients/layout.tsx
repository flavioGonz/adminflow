import DashboardLayout from "@/components/layout/dashboard-layout";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
