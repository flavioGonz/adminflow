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
    Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    id: string; // Relative path
    value: string; // Filename
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
    if (type === "folder") return <Folder className="h-5 w-5 text-indigo-500 fill-indigo-100/50" />;

    const ext = getExtension(filename);
    switch (ext) {
        case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
        case 'doc':
        case 'docx': return <FileText className="h-5 w-5 text-blue-500" />;
        case 'xls':
        case 'xlsx': return <FileText className="h-5 w-5 text-emerald-500" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp': return <ImageIcon className="h-5 w-5 text-purple-500" />;
        case 'mp4':
        case 'mov':
        case 'avi': return <Video className="h-5 w-5 text-pink-500" />;
        case 'mp3':
        case 'wav': return <Music className="h-5 w-5 text-amber-500" />;
        case 'zip':
        case 'rar':
        case '7z': return <Archive className="h-5 w-5 text-orange-500" />;
        default: return <FileIcon className="h-5 w-5 text-slate-400" />;
    }
};

export default function ClientFileVault({ clients, isLoadingClients }: ClientFileVaultProps) {
    const [currentClientId, setCurrentClientId] = useState<string | null>(null);
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
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [stats, setStats] = useState({ count: 0, size: 0 });
    const [newFolderName, setNewFolderName] = useState("");

    const [fileToRename, setFileToRename] = useState<FileItem | null>(null);
    const [newName, setNewName] = useState("");

    const currentClient = useMemo(() =>
        clients.find(c => c.id === currentClientId), [clients, currentClientId]
    );

    const fetchFiles = useCallback(async () => {
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
            const res = await fetch(`${API_URL}/files/${currentClientId}/items?id=${currentPath}`);
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
        if (!item.clientId) return; // Can't delete virtual clients
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
        // Check if previewable
        const ext = item.value.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext || '')) {
            setFileToPreview(item);
            setIsPreviewOpen(true);
        } else {
            handleDownload(item);
        }
    };

    const navigateUp = () => {
        if (currentPath === "/") {
            setCurrentClientId(null);
            return;
        }
        const parts = currentPath.split("/").filter(Boolean);
        parts.pop();
        const newPath = parts.length === 0 ? "/" : parts.join("/");
        setCurrentPath(newPath);
    };

    const enterFolder = (item: FileItem) => {
        if (!currentClientId) {
            setCurrentClientId(item.id);
            setCurrentPath("/");
        } else {
            const newPath = currentPath === "/"
                ? item.value
                : `${currentPath}/${item.value}`;
            setCurrentPath(newPath);
        }
    };

    const getPathText = () => {
        if (!currentClientId) return "Repositorio Global";
        return `${currentClient?.name || "Cliente"} / ${currentPath === "/" ? "" : currentPath}`;
    };

    return (
        <div className="flex flex-col h-[700px] overflow-hidden">
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

            {/* Header / Path */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100/50 bg-transparent">
                <div className="flex items-center gap-3">
                    {/* Only show back arrow if we are INSIDE a client (currentClientId is set) */}
                    {currentClientId && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={navigateUp}
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            {currentClientId ? <Folder className="h-4 w-4 text-indigo-500" /> : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                            <span className="truncate max-w-[200px] sm:max-w-md">
                                {getPathText()}
                            </span>
                        </div>
                    </div>
                </div>

                {currentClientId && (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all hover:shadow-lg hover:translate-y-[-1px]"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Subir Archivo</span>
                        </Button>

                        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-sm">
                                    <FolderPlus className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Nueva Carpeta</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Crear Carpeta</DialogTitle>
                                    <DialogDescription>Crea una nueva carpeta en: <b>{currentPath}</b></DialogDescription>
                                </DialogHeader>
                                <Input
                                    autoFocus
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Nombre de la carpeta"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                                <DialogFooter>
                                    <Button onClick={handleCreateFolder}>Crear</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* Toolbar Filters */}
            <div className="p-3 border-b border-transparent flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {currentClientId ? (
                        <ToggleGroup type="single" value={typeFilter} onValueChange={(v) => v && setTypeFilter(v as FileTypeFilter)}>
                            <ToggleGroupItem value="all" className="text-xs h-7 px-3 bg-white border border-slate-200 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-600 data-[state=on]:border-indigo-200 font-medium transition-all">Todo</ToggleGroupItem>
                            <ToggleGroupItem value="folder" className="text-xs h-7 px-3 gap-1 bg-white border border-slate-200 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-600 data-[state=on]:border-indigo-200 font-medium transition-all"><Folder className="h-3 w-3" /> Carpetas</ToggleGroupItem>
                            <ToggleGroupItem value="image" className="text-xs h-7 px-3 gap-1 bg-white border border-slate-200 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-600 data-[state=on]:border-indigo-200 font-medium transition-all"><ImageIcon className="h-3 w-3" /> Img</ToggleGroupItem>
                            <ToggleGroupItem value="document" className="text-xs h-7 px-3 gap-1 bg-white border border-slate-200 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-600 data-[state=on]:border-indigo-200 font-medium transition-all"><FileText className="h-3 w-3" /> Docs</ToggleGroupItem>
                            <ToggleGroupItem value="media" className="text-xs h-7 px-3 gap-1 bg-white border border-slate-200 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-600 data-[state=on]:border-indigo-200 font-medium transition-all"><Video className="h-3 w-3" /> Media</ToggleGroupItem>
                        </ToggleGroup>
                    ) : (
                        <div />
                    )}

                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar archivo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-white border-slate-200 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all rounded-lg shadow-sm"
                    />
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto px-2">
                <Table className="border-separate border-spacing-y-2">
                    <TableHeader className="bg-transparent sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[30%] cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort("name")}>
                                <div className="flex items-center gap-2">
                                    Nombre
                                    {sortKey === "name" && <ArrowUpDown className="h-3 w-3 text-indigo-500" />}
                                </div>
                            </TableHead>
                            <TableHead className="w-[15%] cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort("client")}>
                                <div className="flex items-center gap-2">
                                    Cliente
                                    {sortKey === "client" && <ArrowUpDown className="h-3 w-3 text-indigo-500" />}
                                </div>
                            </TableHead>
                            <TableHead className="w-[15%] cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort("type")}>
                                <div className="flex items-center gap-2">
                                    Tipo
                                    {sortKey === "type" && <ArrowUpDown className="h-3 w-3 text-indigo-500" />}
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%] cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort("size")}>
                                <div className="flex items-center gap-2">
                                    Tamaño
                                    {sortKey === "size" && <ArrowUpDown className="h-3 w-3 text-indigo-500" />}
                                </div>
                            </TableHead>
                            <TableHead className="w-[15%] cursor-pointer text-slate-500 font-semibold" onClick={() => handleSort("date")}>
                                <div className="flex items-center gap-2">
                                    Fecha subida
                                    {sortKey === "date" && <ArrowUpDown className="h-3 w-3 text-indigo-500" />}
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%] text-right text-slate-500 font-semibold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(loading || isLoadingClients) ? (
                            <TableRow className="bg-transparent hover:bg-transparent">
                                <TableCell colSpan={6} className="h-48 text-center bg-transparent">
                                    <div className="flex flex-col items-center justify-center opacity-60">
                                        <Loader2 className="h-8 w-8 animate-spin mb-2 text-indigo-500" />
                                        <span className="text-sm text-slate-500">
                                            {isLoadingClients ? "Cargando clientes..." : "Cargando archivos..."}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : processedFiles.length === 0 ? (
                            <TableRow className="bg-transparent hover:bg-transparent">
                                <TableCell colSpan={6} className="h-48 text-center bg-transparent">
                                    <div className="flex flex-col items-center justify-center p-8">
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                                            {searchQuery ? <Search className="h-6 w-6 text-slate-400" /> : <Folder className="h-6 w-6 text-slate-400" />}
                                        </div>
                                        <p className="text-slate-600 font-medium">No se encontraron elementos</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            processedFiles.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="group bg-white hover:bg-indigo-50/30 transition-all cursor-pointer rounded-lg shadow-sm border-0 border-l-4 border-l-transparent hover:border-l-indigo-500"
                                    onClick={() => (item.type === "folder") ? enterFolder(item) : handlePreview(item)}
                                >
                                    <TableCell className="rounded-l-lg py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm",
                                                item.type === "folder" ? "bg-indigo-50" : "bg-white border border-slate-100"
                                            )}>
                                                {!currentClientId && item.type === "folder" ? (
                                                    <div className="h-full w-full rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-indigo-200">
                                                        {item.value.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : getFileIcon(item.value, item.type)}
                                            </div>
                                            <span className={cn(
                                                "font-medium truncate max-w-[200px] sm:max-w-[300px]",
                                                item.type === "folder" ? "text-slate-800" : "text-slate-600"
                                            )}>
                                                {item.value}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 font-medium text-xs">
                                        <div className="flex items-center gap-1">
                                            {currentClientId ? <span className="opacity-50">—</span> : (
                                                <>
                                                    <User className="h-3 w-3 text-slate-400" />
                                                    {item.clientName}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs">
                                        <Badge variant="outline" className="font-normal text-slate-500 bg-slate-50 border-slate-200">
                                            {getFileFriendlyType(item.value, item.type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs font-mono">
                                        {item.type === "file" ? formatBytes(item.size) : "—"}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs font-mono">
                                        {item.date ? format(new Date(item.date * 1000), "dd MMM yyyy, HH:mm", { locale: es }) : "—"}
                                    </TableCell>
                                    <TableCell className="text-right rounded-r-lg">
                                        {currentClientId && (
                                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {item.type === "file" && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                            onClick={(e) => { e.stopPropagation(); handlePreview(item); }}
                                                            title="Ver"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                            onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                                                            title="Descargar"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={(e) => e.stopPropagation()}>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFileToRename(item);
                                                            setNewName(item.value);
                                                        }}>
                                                            <Edit2 className="mr-2 h-3.5 w-3.5" /> Renombrar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                                        >
                                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar Archivo
                                                        </DropdownMenuItem>
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

            {/* Footer Status */}
            <div className="p-4 bg-transparent text-xs text-slate-400 flex justify-between items-center font-medium border-t border-slate-100/50">
                <div className="flex gap-4">
                    <span>{stats.count} elementos</span>
                    {currentClientId && <span>{formatBytes(stats.size)} usados en este directorio</span>}
                </div>
            </div>

            {/* Rename Dialog */}
            <Dialog open={!!fileToRename} onOpenChange={(o) => { if (!o) setFileToRename(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renombrar</DialogTitle>
                        <DialogDescription>Cambiar nombre a: {fileToRename?.value}</DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nuevo nombre"
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFileToRename(null)}>Cancelar</Button>
                        <Button onClick={handleRename}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
