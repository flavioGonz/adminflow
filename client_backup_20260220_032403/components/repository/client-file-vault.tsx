"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Folder,
    File as FileIcon,
    MoreVertical,
    Download,
    Trash2,
    Edit2,
    ArrowLeft,
    Loader2,
    Upload,
    FolderPlus,
    Search,
    FileText,
    Image as ImageIcon,
    Music,
    Video,
    Archive,
    ArrowUpDown,
    User,
    ShieldCheck,
    Eye,
    ChevronRight,
    Home
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FilterToolbar, ToolbarButton } from "@/components/ui/filter-toolbar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/http";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Client } from "@/types/client";
import { FileVaultUploadModal } from "./file-vault-upload-modal";
import { FilePreviewDialog } from "./file-preview-dialog";

// --- Types ---
interface FileItem {
    id: string; // Relative path from client root
    value: string; // Filename/Foldername
    size?: number; // Optional for folders
    date?: number; // Unix timestamp
    type: "file" | "folder";
    data?: any[];
    clientName?: string; // For display
    clientId?: string; // Context
}

interface ClientFileVaultProps {
    clients: Client[];
    isLoadingClients: boolean;
    initialClientId?: string;
}

type FileTypeFilter = "all" | "folder" | "image" | "document" | "media" | "archive";
type SortKey = "name" | "size" | "date" | "client" | "type";
type SortDirection = "asc" | "desc";

// --- Helpers ---
const formatBytes = (bytes: number | undefined, decimals = 2) => {
    if (bytes === undefined) return "—";
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const getExtension = (filename: string) => filename.split('.').pop()?.toLowerCase() || "";

const getFileCategory = (filename: string, type: "file" | "folder"): FileTypeFilter => {
    if (type === "folder") return "folder";
    const ext = getExtension(filename);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return "image";
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'rtf', 'ppt', 'pptx'].includes(ext)) return "document";
    if (['mp3', 'wav', 'mp4', 'mov', 'avi', 'mkv'].includes(ext)) return "media";
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return "archive";
    return "all"; // Fallback to generic
};

const getFileFriendlyType = (filename: string, type: "file" | "folder"): string => {
    if (type === "folder") return "Carpeta";
    const ext = getExtension(filename);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return "Imagen";
    if (ext === 'pdf') return "Documento PDF";
    if (['doc', 'docx'].includes(ext)) return "Word";
    if (['xls', 'xlsx'].includes(ext)) return "Excel";
    if (['zip', 'rar', '7z'].includes(ext)) return "Comprimido";
    if (['mp4', 'mov', 'avi'].includes(ext)) return "Video";
    if (['mp3', 'wav'].includes(ext)) return "Audio";
    return (ext.toUpperCase() || "Archivo");
};

const getFileIcon = (filename: string, type: "file" | "folder") => {
    if (type === "folder") return <Folder className="h-4 w-4 text-indigo-500 fill-indigo-100/50" />;

    const ext = getExtension(filename);
    switch (ext) {
        case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
        case 'doc':
        case 'docx': return <FileText className="h-4 w-4 text-blue-500" />;
        case 'xls':
        case 'xlsx': return <FileText className="h-4 w-4 text-emerald-500" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp': return <ImageIcon className="h-4 w-4 text-purple-500" />;
        case 'mp4':
        case 'mov':
        case 'avi': return <Video className="h-4 w-4 text-pink-500" />;
        case 'mp3':
        case 'wav': return <Music className="h-4 w-4 text-amber-500" />;
        case 'zip':
        case 'rar':
        case '7z': return <Archive className="h-4 w-4 text-orange-500" />;
        default: return <FileIcon className="h-4 w-4 text-slate-400" />;
    }
};

export default function ClientFileVault({ clients, isLoadingClients, initialClientId }: ClientFileVaultProps) {
    const [currentClientId, setCurrentClientId] = useState<string | null>(initialClientId || null);
    const [currentPath, setCurrentPath] = useState("/");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filtering & Sorting
    const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDirection>("asc");

    // Modal States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [fileToPreview, setFileToPreview] = useState<FileItem | null>(null);

    // Dialog States
    const [stats, setStats] = useState({ count: 0, size: 0 });
    const [newFolderName, setNewFolderName] = useState("");
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

    const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
    const [newName, setNewName] = useState("");

    const currentClient = useMemo(() =>
        clients.find(c => c.id === currentClientId), [clients, currentClientId]
    );

    const fetchFiles = useCallback(async () => {
        setFiles([]); // Clear existing list for transition
        if (!currentClientId) {
            setLoading(true);
            const clientFolders: FileItem[] = clients.map(client => ({
                id: client.id,
                value: client.name,
                type: "folder",
                size: undefined,
                date: undefined,
                clientName: client.name,
                clientId: client.id
            }));
            setFiles(clientFolders);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/files/${currentClientId}/items?id=${encodeURIComponent(currentPath)}`);
            if (!res.ok) throw new Error("Error al cargar archivos");
            const data: FileItem[] = await res.json();
            const enriched = data.map(f => ({
                ...f,
                clientName: currentClient?.name,
                clientId: currentClientId
            }));
            setFiles(enriched);
        } catch (error) {
            console.error(error);
            toast.error("No se pudieron cargar los archivos.");
        } finally {
            setLoading(false);
        }
    }, [currentClientId, currentPath, clients, currentClient]);

    useEffect(() => {
        if (!isLoadingClients) {
            fetchFiles();
        }
    }, [fetchFiles, isLoadingClients]);

    const processedFiles = useMemo(() => {
        let filtered = files.filter(f => f.value.toLowerCase().includes(searchQuery.toLowerCase()));

        if (typeFilter !== "all" && currentClientId) {
            filtered = filtered.filter(f => {
                const cat = getFileCategory(f.value, f.type);
                return cat === typeFilter;
            });
        }

        return filtered.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === "folder" ? -1 : 1;
            }

            let comp = 0;
            switch (sortKey) {
                case "name":
                    comp = a.value.localeCompare(b.value);
                    break;
                case "size":
                    comp = (a.size || 0) - (b.size || 0);
                    break;
                case "date":
                    comp = (a.date || 0) - (b.date || 0);
                    break;
                case "client":
                    comp = (a.clientName || "").localeCompare(b.clientName || "");
                    break;
                case "type":
                    comp = getFileFriendlyType(a.value, a.type).localeCompare(getFileFriendlyType(b.value, b.type));
                    break;
            }
            return sortDir === "asc" ? comp : -comp;
        });
    }, [files, searchQuery, typeFilter, sortKey, sortDir, currentClientId]);

    useEffect(() => {
        const totalSize = files.reduce((acc, curr) => acc + (curr.type === 'file' ? (curr.size || 0) : 0), 0);
        setStats({ count: files.length, size: totalSize });
    }, [files]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !currentClientId) return;
        try {
            const res = await fetch(`${API_URL}/files/${currentClientId}/folder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentPath === "/" ? "" : currentPath,
                    value: newFolderName
                }),
            });
            if (!res.ok) throw new Error("Error creando carpeta");
            toast.success("Carpeta creada");
            setNewFolderName("");
            setIsCreateFolderOpen(false);
            fetchFiles();
        } catch (error) {
            toast.error("No se pudo crear la carpeta");
        }
    };

    const handleDelete = async (item: FileItem) => {
        if (!item.clientId) return;
        if (!confirm(`¿Estás seguro de eliminar "${item.value}"?`)) return;
        try {
            const res = await fetch(`${API_URL}/files/${item.clientId}/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id }),
            });
            if (!res.ok) throw new Error("Error eliminando");
            toast.success("Elemento eliminado");
            fetchFiles();
        } catch (error) {
            toast.error("No se pudo eliminar el elemento.");
        }
    };

    const handleRename = async () => {
        if (!fileToRename || !newName.trim() || !fileToRename.clientId) return;
        try {
            const res = await fetch(`${API_URL}/files/${fileToRename.clientId}/rename`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: fileToRename.id, value: newName }),
            });
            if (res.status === 409) {
                toast.error("Ya existe un archivo con ese nombre");
                return;
            }
            if (!res.ok) throw new Error("Error renombrando");

            toast.success("Renombrado con éxito");
            setFileToRename(null);
            setNewName("");
            fetchFiles();
        } catch (error) {
            toast.error("No se pudo renombrar.");
        }
    };

    const handleDownload = (item: FileItem) => {
        if (item.type === "folder" || !item.clientId) return;
        const url = `${API_URL}/files/${item.clientId}/download?id=${encodeURIComponent(item.id)}`;
        window.open(url, "_blank");
    };

    const handlePreview = (item: FileItem) => {
        if (item.type !== "file") return;
        const ext = item.value.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext || '')) {
            setFileToPreview(item);
            setIsPreviewOpen(true);
        } else {
            handleDownload(item);
        }
    };

    const navigateToPath = (path: string) => {
        setCurrentPath(path);
    };

    const navigateToClient = (clientId: string | null) => {
        setCurrentClientId(clientId);
        setCurrentPath("/");
    };

    const enterFolder = (item: FileItem) => {
        if (!currentClientId) {
            setCurrentClientId(item.id);
            setCurrentPath("/");
        } else {
            setCurrentPath(item.id);
        }
    };

    const breadcrumbs = useMemo(() => {
        const crumbs: { label: string; path?: string; clientId?: string | null }[] = [];
        crumbs.push({ label: "Inicio", clientId: null });
        if (currentClientId) {
            crumbs.push({ label: currentClient?.name || "Cliente", path: "/" });
            if (currentPath !== "/") {
                const parts = currentPath.split("/").filter(Boolean);
                let buildPath = "";
                parts.forEach((part, index) => {
                    buildPath += (index === 0 ? "" : "/") + part;
                    crumbs.push({ label: part, path: buildPath });
                });
            }
        }
        return crumbs;
    }, [currentClientId, currentPath, currentClient]);

    return (
        <div className="flex flex-col h-[700px] overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100">
            <FileVaultUploadModal
                open={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
                clientId={currentClientId || ""}
                currentPath={currentPath}
                onUploadComplete={fetchFiles}
            />

            <FilePreviewDialog
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                file={fileToPreview}
            />

            <div className="flex items-center gap-2 p-4 border-b border-slate-100/50 bg-slate-50/30">
                {breadcrumbs.map((crumb, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold">
                        {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                        <button
                            onClick={() => {
                                if (crumb.clientId !== undefined) {
                                    if (initialClientId && crumb.clientId === null) return;
                                    navigateToClient(crumb.clientId);
                                } else if (crumb.path !== undefined) {
                                    navigateToPath(crumb.path);
                                }
                            }}
                            className={cn(
                                "flex items-center gap-1.5 transition-colors hover:text-indigo-600",
                                idx === breadcrumbs.length - 1 ? "text-slate-900" : "text-slate-400"
                            )}
                        >
                            {idx === 0 && <Home className="h-3 w-3" />}
                            {crumb.label}
                        </button>
                    </div>
                ))}

                {currentClientId && (
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-4 rounded-xl shadow-sm transition-all text-[10px] uppercase font-black tracking-widest"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            <Upload className="h-3.5 w-3.5 mr-2" />
                            Subir
                        </Button>

                        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl border-slate-200 bg-white text-slate-600">
                                    <FolderPlus className="h-3.5 w-3.5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle className="font-black">Nueva Carpeta</DialogTitle>
                                    <DialogDescription className="text-xs font-medium">Ubicación: <b>{currentPath}</b></DialogDescription>
                                </DialogHeader>
                                <Input
                                    autoFocus
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Nombre de la carpeta"
                                    className="h-11 rounded-2xl border-slate-200 font-bold"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                                <DialogFooter>
                                    <Button onClick={handleCreateFolder} className="h-10 rounded-xl bg-indigo-600 font-bold">Crear Carpeta</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            <FilterToolbar
                searchTerm={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Filtrar por nombre..."
                className="px-4 mt-2"
            >
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <ToolbarButton
                        icon={Folder}
                        label="Todo"
                        isActive={typeFilter === "all"}
                        onClick={() => setTypeFilter("all")}
                    />
                    <ToolbarButton
                        icon={Folder}
                        label="Carpetas"
                        isActive={typeFilter === "folder"}
                        onClick={() => setTypeFilter("folder")}
                    />
                    <ToolbarButton
                        icon={ImageIcon}
                        label="Imágenes"
                        isActive={typeFilter === "image"}
                        onClick={() => setTypeFilter("image")}
                        variant="info"
                    />
                    <ToolbarButton
                        icon={FileText}
                        label="Docs"
                        isActive={typeFilter === "document"}
                        onClick={() => setTypeFilter("document")}
                        variant="success"
                    />
                    <ToolbarButton
                        icon={Video}
                        label="Media"
                        isActive={typeFilter === "media"}
                        onClick={() => setTypeFilter("media")}
                        variant="warning"
                    />
                    <ToolbarButton
                        icon={Archive}
                        label="Zips"
                        isActive={typeFilter === "archive"}
                        onClick={() => setTypeFilter("archive")}
                        variant="error"
                    />
                </div>

                <div className="w-px h-6 bg-slate-200/60 mx-1 hidden md:block" />

                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 ml-auto">
                    {stats.count} elementos • {formatBytes(stats.size)}
                </div>
            </FilterToolbar>

            <div className="flex-1 overflow-auto px-4">
                <Table>
                    <TableHeader className="bg-transparent sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[45%] cursor-pointer font-black text-[9px] uppercase tracking-widest text-slate-400" onClick={() => handleSort("name")}>
                                <div className="flex items-center gap-2">Nombre {sortKey === "name" && <ArrowUpDown className="h-3 w-3" />}</div>
                            </TableHead>
                            {!currentClientId && (
                                <TableHead className="w-[20%] cursor-pointer font-black text-[9px] uppercase tracking-widest text-slate-400" onClick={() => handleSort("client")}>
                                    <div className="flex items-center gap-2">Cliente {sortKey === "client" && <ArrowUpDown className="h-3 w-3" />}</div>
                                </TableHead>
                            )}
                            <TableHead className="w-[15%] cursor-pointer font-black text-[9px] uppercase tracking-widest text-slate-400" onClick={() => handleSort("type")}>
                                <div className="flex items-center gap-2">Tipo {sortKey === "type" && <ArrowUpDown className="h-3 w-3" />}</div>
                            </TableHead>
                            <TableHead className="w-[15%] cursor-pointer font-black text-[9px] uppercase tracking-widest text-slate-400" onClick={() => handleSort("size")}>
                                <div className="flex items-center gap-2">Tamaño {sortKey === "size" && <ArrowUpDown className="h-3 w-3" />}</div>
                            </TableHead>
                            <TableHead className="w-[15%] text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(loading || isLoadingClients) ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-400" /></TableCell></TableRow>
                        ) : processedFiles.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Bóveda vacía</TableCell></TableRow>
                        ) : (
                            processedFiles.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                                    onClick={() => (item.type === "folder") ? enterFolder(item) : handlePreview(item)}
                                >
                                    <TableCell className="py-2.5">
                                        <div className="flex items-center gap-3">
                                            {item.type === "folder" && !currentClientId ? (
                                                <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">{item.value.charAt(0)}</div>
                                            ) : getFileIcon(item.value, item.type)}
                                            <span className="font-bold text-xs text-slate-700 truncate max-w-[250px]">{item.value}</span>
                                        </div>
                                    </TableCell>
                                    {!currentClientId && (
                                        <TableCell className="py-2.5">
                                            <span className="text-[11px] font-medium text-slate-400">{item.clientName}</span>
                                        </TableCell>
                                    )}
                                    <TableCell className="py-2.5">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5 border-slate-200 text-slate-400">
                                            {getFileFriendlyType(item.value, item.type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-2.5 text-[10px] font-mono text-slate-400">
                                        {item.type === "file" ? formatBytes(item.size) : "—"}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right">
                                        {currentClientId && (
                                            <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                                                {item.type === "file" && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white" onClick={() => handleDownload(item)}><Download className="h-3.5 w-3.5" /></Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl">
                                                        <DropdownMenuItem onClick={() => { setFileToRename(item); setNewName(item.value); }}><Edit2 className="mr-2 h-3.5 w-3.5" /> Renombrar</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <div className="flex gap-4">
                    <span>{stats.count} elementos</span>
                    {currentClientId && <span>{formatBytes(stats.size)} usados</span>}
                </div>
            </div>

            <Dialog open={!!fileToRename} onOpenChange={(o) => { if (!o) setFileToRename(null); }}>
                <DialogContent className="rounded-3xl">
                    <DialogHeader><DialogTitle className="font-black">Renombrar</DialogTitle></DialogHeader>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-11 rounded-2xl border-slate-200 font-bold" onKeyDown={e => e.key === 'Enter' && handleRename()} />
                    <DialogFooter><Button onClick={handleRename} className="h-10 rounded-xl bg-indigo-600 font-bold">Guardar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
