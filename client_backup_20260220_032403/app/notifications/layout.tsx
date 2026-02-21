import DashboardLayout from "@/components/layout/dashboard-layout";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
