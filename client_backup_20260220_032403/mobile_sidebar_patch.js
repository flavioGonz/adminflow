const fs = require('fs');

// Patch dashboard-layout.tsx for mobile sidebar
const dashboardLayoutPath = '/opt/adminflow/client/components/layout/dashboard-layout.tsx';
let dashboardLayout = fs.readFileSync(dashboardLayoutPath, 'utf8');

const oldDashboardLayout = `function DashboardLayoutShell({
  children,
  mainClassName,
  className,
}: DashboardLayoutProps) {
  const { collapsed } = useSidebar();
  const { status } = useSession();
  const router = useRouter();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  useShowKeyboardHelp();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const defaultMainClass =
    "relative flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto min-w-0";
  const gridColsClass = collapsed
    ? "lg:grid-cols-[80px_minmax(0,1fr)]"
    : "lg:grid-cols-[280px_minmax(0,1fr)]";

  return (
    <div className={\`h-screen w-full lg:grid \${gridColsClass}\`}>
      <SidebarContent />
      <main className={cn(mainClassName ?? defaultMainClass, className)}>{children}</main>
    </div>
  );
}`;

const newDashboardLayout = `function DashboardLayoutShell({
  children,
  mainClassName,
  className,
}: DashboardLayoutProps) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { status } = useSession();
  const router = useRouter();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  useShowKeyboardHelp();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const defaultMainClass =
    "relative flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto min-w-0";
  const gridColsClass = collapsed
    ? "lg:grid-cols-[80px_minmax(0,1fr)]"
    : "lg:grid-cols-[280px_minmax(0,1fr)]";

  return (
    <div className={\`h-screen w-full lg:grid \${gridColsClass}\`}>
      {/* Mobile header with hamburger */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-900">
          AdminFlow
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-72 bg-white h-full overflow-y-auto">
            <SidebarContent />
          </div>
        </div>
      )}
      
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <SidebarContent />
      </div>
      
      <main className={cn(mainClassName ?? defaultMainClass, className)}>{children}</main>
    </div>
  );
}`;

if (dashboardLayout.includes(oldDashboardLayout)) {
  dashboardLayout = dashboardLayout.replace(oldDashboardLayout, newDashboardLayout);
  fs.writeFileSync(dashboardLayoutPath, dashboardLayout);
  console.log('Patched dashboard-layout.tsx');
} else {
  console.log('dashboard-layout.tsx pattern not found, checking CRLF...');
  const oldCRLF = oldDashboardLayout.replace(/\n/g, '\r\n');
  if (dashboardLayout.includes(oldCRLF)) {
    dashboardLayout = dashboardLayout.replace(oldCRLF, newDashboardLayout.replace(/\n/g, '\r\n'));
    fs.writeFileSync(dashboardLayoutPath, dashboardLayout);
    console.log('Patched dashboard-layout.tsx (CRLF)');
  } else {
    console.log('Could not find pattern in dashboard-layout.tsx');
  }
}
