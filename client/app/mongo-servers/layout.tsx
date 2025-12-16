import DashboardLayout from "@/components/layout/dashboard-layout";

export default function MongoServersLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
