const fs = require('fs');

const clientTablePath = '/opt/adminflow/client/components/clients/client-table.tsx';
let content = fs.readFileSync(clientTablePath, 'utf8');

// 1. Add DropdownMenu imports if not present
if (!content.includes("DropdownMenu,")) {
  content = content.replace(
    'import { Button } from "@/components/ui/button";',
    `import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";`
  );
  console.log('Added DropdownMenu imports');
}

// 2. Add MoreVertical icon import if not present
if (!content.includes("MoreVertical")) {
  content = content.replace(
    /from "lucide-react";/,
    `MoreVertical,
} from "lucide-react";`
  );
  // Also need to add it to the import list
  content = content.replace(
    /import \{([^}]+)\} from "lucide-react";/,
    (match, icons) => {
      if (!icons.includes('MoreVertical')) {
        return match.replace('} from "lucide-react"', ', MoreVertical } from "lucide-react"');
      }
      return match;
    }
  );
  console.log('Added MoreVertical icon import');
}

// 3. Replace the actions cell with a dropdown menu
const oldActionsCell = `<TableCell className="text-right py-4 pr-6">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <EditClientDialog
                          client={client}
                          onClientUpdated={onClientUpdated}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm">
                            <Edit className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                        </EditClientDialog>
                        <DeleteClientDialog
                          client={client}
                          onClientDeleted={onClientDeleted}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </DeleteClientDialog>
                        {client.phone && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-emerald-50 hover:text-emerald-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanPhone = client.phone!.replace(/\\D/g, "");
                                    window.open(\`https://wa.me/\${cleanPhone}\`, "_blank");
                                }}
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                        )}
                      </div>
                    </TableCell>`;

const newActionsCell = `<TableCell className="text-right py-4 pr-6">
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <EditClientDialog
                              client={client}
                              onClientUpdated={onClientUpdated}
                            >
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4 text-slate-500" />
                                Editar cliente
                              </DropdownMenuItem>
                            </EditClientDialog>
                            {client.phone && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  const cleanPhone = client.phone!.replace(/\\D/g, "");
                                  window.open(\`https://wa.me/\${cleanPhone}\`, "_blank");
                                }}
                              >
                                <MessageCircle className="mr-2 h-4 w-4 text-emerald-500" />
                                Enviar WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DeleteClientDialog
                              client={client}
                              onClientDeleted={onClientDeleted}
                            >
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar cliente
                              </DropdownMenuItem>
                            </DeleteClientDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>`;

// Try LF
if (content.includes(oldActionsCell)) {
  content = content.replace(oldActionsCell, newActionsCell);
  console.log('Replaced actions cell (LF)');
} else {
  // Try CRLF
  const oldActionsCellCRLF = oldActionsCell.replace(/\n/g, '\r\n');
  if (content.includes(oldActionsCellCRLF)) {
    content = content.replace(oldActionsCellCRLF, newActionsCell.replace(/\n/g, '\r\n'));
    console.log('Replaced actions cell (CRLF)');
  } else {
    console.log('Could not find exact actions cell pattern');
  }
}

fs.writeFileSync(clientTablePath, content);
console.log('Done updating client table');
