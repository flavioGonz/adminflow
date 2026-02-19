const fs = require('fs');

// Patch sidebar.tsx to add mobileOpen state to context
const sidebarPath = '/opt/adminflow/client/components/layout/sidebar.tsx';
let sidebar = fs.readFileSync(sidebarPath, 'utf8');

// Update context type
const oldContextType = `const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
});`;

const newContextType = `const SidebarContext = createContext<{ 
  collapsed: boolean; 
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}>({
  collapsed: false,
  toggle: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});`;

// Update provider
const oldProviderStart = `export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);`;

const newProviderStart = `export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);`;

// Update value memo
const oldValueMemo = `const value = useMemo(
    () => ({
      collapsed,
      toggle: handleToggle,
    }),
    [collapsed]
  );`;

const newValueMemo = `const value = useMemo(
    () => ({
      collapsed,
      toggle: handleToggle,
      mobileOpen,
      setMobileOpen,
    }),
    [collapsed, mobileOpen]
  );`;

function replacePattern(text, old, replacement) {
  if (text.includes(old)) {
    return { text: text.replace(old, replacement), found: true };
  }
  const oldCRLF = old.replace(/\n/g, '\r\n');
  if (text.includes(oldCRLF)) {
    return { text: text.replace(oldCRLF, replacement.replace(/\n/g, '\r\n')), found: true };
  }
  return { text, found: false };
}

let result;

result = replacePattern(sidebar, oldContextType, newContextType);
if (result.found) {
  sidebar = result.text;
  console.log('Patched context type');
} else {
  console.log('Context type pattern not found');
}

result = replacePattern(sidebar, oldProviderStart, newProviderStart);
if (result.found) {
  sidebar = result.text;
  console.log('Patched provider start');
} else {
  console.log('Provider start pattern not found');
}

result = replacePattern(sidebar, oldValueMemo, newValueMemo);
if (result.found) {
  sidebar = result.text;
  console.log('Patched value memo');
} else {
  console.log('Value memo pattern not found');
}

fs.writeFileSync(sidebarPath, sidebar);
console.log('Saved sidebar.tsx');
