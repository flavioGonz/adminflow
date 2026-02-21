const fs = require('fs');

const sidebarPath = '/opt/adminflow/client/components/layout/sidebar.tsx';
let content = fs.readFileSync(sidebarPath, 'utf8');

// Remove the user info block (the card with Equipo, Usuario, email, tickets)
const userInfoBlockStart = `<div className="px-4 pb-3">
        {!collapsed && (
          <div className="mb-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-100 p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">{userRole}</p>
                <p className="text-base font-semibold text-slate-900 leading-tight">{userName}</p>
                <p className="text-xs font-medium text-slate-500">{userEmail}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {openTickets} tickets abiertos
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:bg-slate-200 mt-1 ml-auto mr-6"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    <span className="sr-only">Ayuda</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-56">
                  <DropdownMenuLabel className="text-xs uppercase text-slate-500">
                    Ayuda y soporte
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/support/documentacion" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Documentacion
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/support/centro" className="flex items-center gap-2">
                      <MessageCircleQuestion className="h-4 w-4" />
                      Centro de ayuda
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="mailto:info@infratec.com.uy" className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Enviar feedback
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/support/estado" className="flex items-center gap-2">
                      <LifeBuoy className="h-4 w-4" />
                      Estado del sistema
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>`;

// Try LF first
if (content.includes(userInfoBlockStart)) {
  content = content.replace(userInfoBlockStart, '');
  console.log('Removed user info block (LF)');
} else {
  // Try CRLF
  const userInfoBlockCRLF = userInfoBlockStart.replace(/\n/g, '\r\n');
  if (content.includes(userInfoBlockCRLF)) {
    content = content.replace(userInfoBlockCRLF, '');
    console.log('Removed user info block (CRLF)');
  } else {
    console.log('User info block not found, trying regex...');
    // Use regex to find and remove it
    const pattern = /<div className="px-4 pb-3">\s*\{!collapsed && \(\s*<div className="mb-3 rounded-2xl[\s\S]*?<\/DropdownMenu>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>/;
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      console.log('Removed user info block via regex');
    } else {
      console.log('Could not find user info block');
    }
  }
}

// Remove the openTickets variable since we no longer use it
content = content.replace(/const openTickets = \(session\?\.user as any\)\?\.assignedTickets \?\? 0;\r?\n?/g, '');

fs.writeFileSync(sidebarPath, content);
console.log('Done');
