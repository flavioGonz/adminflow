import SupportLayout from "@/components/layout/support-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SupportLayout
      title="Centro de Ayuda"
      showBackButton={true}
      backHref="/dashboard"
    >
      {children}
    </SupportLayout>
  );
}
