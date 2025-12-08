"use client";

import {
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
    DragEvent,
    ChangeEvent,
    ReactNode,
} from "react";
import {
    Download,
    Upload,
    FileText,
    FileSpreadsheet,
    Trash2,
    Plus,
    Save,
    Edit,
    Server,
    Camera,
    Router,
    Phone,
    Monitor,
    Laptop,
    Zap,
    CheckCircle,
    AlertTriangle,
    Copy,
    Search,
    X,
    Network,
    ClipboardList,
    Image,
    Circle,
    MessageCircle,
    Mail,
    BatteryCharging,
    Wifi,
    Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";

// Types
type PortInfo = {
    desc: string;
    mac: string;
    length: string;
    obs: string;
    certified: boolean;
    poe: boolean;
};

type PanelData = Record<string, PortInfo>;

type AppData = {
    clientInfo: {
        clientName: string;
        projectName: string;
        technicianName: string;
        installationDate: string;
        installationTechnician: string;
        onsiteContact: string;
    };
    rack: {
        name: string;
        height: number;
        startU: number;
        brand: string;
    };
    panels: Record<string, PanelData>;
};

type GalleryFile = {
    id: string;
    name: string;
    preview: string;
    progress: number;
    status: "uploading" | "done";
};

export type PatchPanelManagerHandle = {
    resetPanel: () => void;
    exportPdf: () => void;
    exportExcel: () => void;
};

const UNPATCHED_STATE = "Libre";

const getDefaultPanelData = (): PanelData => {
    const data: PanelData = {};
    for (let i = 1; i <= 24; i++) {
        data[i.toString()] = {
            desc: UNPATCHED_STATE,
            mac: "",
            length: "",
            obs: "",
            certified: false,
            poe: false,
        };
    }
    return data;
};

const connectionTypes = [
    UNPATCHED_STATE,
    "Switch",
    "Servidor",
    "Cámara",
    "Router",
    "Teléfono IP",
    "Modem",
    "PC",
    "UPS",
];

const connectionIconMap: Record<string, ReactNode> = {
    Switch: <Server className="h-3.5 w-3.5 text-slate-500" />,
    Servidor: <Server className="h-3.5 w-3.5 text-slate-500" />,
    Cámara: <Camera className="h-3.5 w-3.5 text-slate-500" />,
    Router: <Router className="h-3.5 w-3.5 text-slate-500" />,
    "Teléfono IP": <Phone className="h-3.5 w-3.5 text-slate-500" />,
    Modem: <Wifi className="h-3.5 w-3.5 text-slate-500" />,
    PC: <Laptop className="h-3.5 w-3.5 text-slate-500" />,
    UPS: <BatteryCharging className="h-3.5 w-3.5 text-slate-500" />,
};

const getConnectionIcon = (desc?: string): ReactNode => {
    if (!desc) return null;
    const normalized = desc.trim();
    if (normalized === UNPATCHED_STATE) return null;
    return connectionIconMap[normalized] ?? <Plug className="h-3.5 w-3.5 text-slate-500" />;
};

interface PatchPanelManagerProps {
    clientId: string;
}

export const PatchPanelManager = forwardRef<PatchPanelManagerHandle, PatchPanelManagerProps>(
    function PatchPanelManager({ clientId }, ref) {
    const [appData, setAppData] = useState<AppData>({
        clientInfo: {
            clientName: "N/A",
            projectName: "N/A",
            technicianName: "N/A",
            installationDate: "",
            installationTechnician: "",
            onsiteContact: "",
        },
        rack: { name: "Rack Principal", height: 24, startU: 1, brand: "" },
        panels: { "Panel Principal": getDefaultPanelData() },
    });
    const [currentPanelName, setCurrentPanelName] = useState<string>("Panel Principal");
    const [currentFilter, setCurrentFilter] = useState<"all" | "occupied" | "unpatched">("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingClient, setIsEditingClient] = useState(false);
    const [isEditingRack, setIsEditingRack] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [activePortId, setActivePortId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        message: string;
        type: "confirm" | "prompt";
        onConfirm: (value?: string) => void;
        icon?: ReactNode;
        confirmVariant?: "default" | "destructive";
        confirmLabel?: string;
    }>({
        title: "",
        message: "",
        type: "confirm",
        onConfirm: () => {},
        icon: <AlertTriangle className="h-4 w-4 text-white" />,
        confirmLabel: "Confirmar",
    });
    const [modalInputValue, setModalInputValue] = useState("");
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [galleryFiles, setGalleryFiles] = useState<GalleryFile[]>([]);
    const [isDraggingGallery, setIsDraggingGallery] = useState(false);
    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [selectedGalleryFile, setSelectedGalleryFile] = useState<GalleryFile | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const galleryPreviewsRef = useRef<string[]>([]);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch(`${API_URL}/clients/${clientId}/implementation`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.appData) {
                        setAppData(data.appData);
                        setCurrentPanelName(data.currentPanelName || Object.keys(data.appData.panels)[0]);
                        setCurrentFilter(data.currentFilter || "all");
                    }
                }
            } catch (error) {
                console.error("Error loading implementation data:", error);
                toast.error("Error al cargar los datos de implementación.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [clientId]);

    const saveData = async (newData: AppData, panelName: string, filter: string) => {
        try {
            await fetch(`${API_URL}/clients/${clientId}/implementation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appData: newData,
                    currentPanelName: panelName,
                    currentFilter: filter,
                }),
            });
            setAppData(newData);
            toast.success("Datos guardados correctamente.");
        } catch (error) {
            console.error("Error saving implementation data:", error);
            toast.error("Error al guardar los datos.");
        }
    };

    const currentPanelData = appData.panels[currentPanelName] || {};

    const isPortUnpatched = (portInfo: PortInfo) =>
        !portInfo || (portInfo.desc || "").toLowerCase().trim() === UNPATCHED_STATE.toLowerCase();

    const formatInstallationDate = (value?: string) => {
        if (!value) return "";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return "";
        return parsed.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    };

    const handleDateSelect = (date?: Date | null) => {
        const isoDate = date ? date.toISOString().split("T")[0] : "";
        setAppData({
            ...appData,
            clientInfo: {
                ...appData.clientInfo,
                installationDate: isoDate,
            },
        });
        setDatePickerOpen(false);
    };

    const generateShareText = () => {
        const clientNameLabel = appData.clientInfo.clientName || clientId;
        const filledPorts = Object.entries(currentPanelData).filter(
            ([, info]) => info && !isPortUnpatched(info)
        );
        const filledSummary =
            filledPorts.length > 0
                ? filledPorts
                      .slice(0, 5)
                      .map(([portId, info]) => `${portId}: ${info.desc || "Sin tipo"}`)
                      .join(", ")
                : "Sin dispositivos conectados aún";

        return [
            `Implementación - ${clientNameLabel}`,
            `Panel: ${currentPanelName}`,
            `Fecha: ${appData.clientInfo.installationDate || "N/A"}`,
            `Puertos ocupados: ${filledPorts.length}`,
            `Detalles: ${filledSummary}`,
        ].join("\n");
    };

    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(generateShareText())}`;
    const emailShareUrl =
        `mailto:?subject=Implementación ${encodeURIComponent(appData.clientInfo.clientName || clientId)}&body=` +
        encodeURIComponent(generateShareText());

    const generateGalleryId = () =>
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const simulateUploadProgress = (id: string) => {
        let progress = 0;

        const step = () => {
            progress = Math.min(100, progress + Math.random() * 25 + 10);
            setGalleryFiles((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                              ...item,
                              progress,
                              status: progress >= 100 ? "done" : "uploading",
                          }
                        : item
                )
            );

            if (progress < 100) {
                window.setTimeout(step, 180);
            }
        };

        step();
    };

    const addGalleryFile = (file: File) => {
        const id = generateGalleryId();
        const preview = URL.createObjectURL(file);
        galleryPreviewsRef.current.push(preview);
        const newFile: GalleryFile = {
            id,
            name: file.name,
            preview,
            progress: 0,
            status: "uploading",
        };

        setGalleryFiles((prev) => [...prev, newFile]);
        simulateUploadProgress(id);
    };

    const handleGalleryFiles = (files: FileList | File[]) => {
        const list = Array.isArray(files) ? files : Array.from(files);
        list.forEach(addGalleryFile);
    };

    const handleGalleryDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingGallery(true);
    };

    const handleGalleryDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingGallery(false);
    };

    const handleGalleryDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingGallery(false);
        if (event.dataTransfer?.files?.length) {
            handleGalleryFiles(event.dataTransfer.files);
        }
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target;
        if (files?.length) {
            handleGalleryFiles(files);
            event.target.value = "";
        }
    };

    const openGalleryModal = (file: GalleryFile) => {
        setSelectedGalleryFile(file);
        setGalleryModalOpen(true);
    };

    const openGalleryInput = () => {
        galleryInputRef.current?.click();
    };

    useEffect(() => {
        return () => {
            galleryPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    const activePortStatus = activePortId ? isPortUnpatched(currentPanelData[activePortId]) : true;

    const handlePortClick = (portId: string) => {
        setActivePortId(portId);
        setPopoverOpen(true);
    };

    const handleSavePort = (portId: string, newData: PortInfo) => {
        const newPanelData = { ...currentPanelData, [portId]: newData };
        const newAppData = {
            ...appData,
            panels: { ...appData.panels, [currentPanelName]: newPanelData },
        };

        if (isPortUnpatched(newData)) {
            newPanelData[portId] = { ...newData, mac: '', length: '', obs: '', certified: false, poe: false };
        }

        saveData(newAppData, currentPanelName, currentFilter);
        setPopoverOpen(false);
    };

    const handleAddPanel = () => {
        setModalConfig({
            title: "Añadir Nuevo Panel",
            message: "Nombre para el nuevo patch panel:",
            type: "prompt",
            icon: <Plus className="h-4 w-4 text-white" />,
            confirmLabel: "Crear",
            confirmVariant: "default",
            onConfirm: (name) => {
                if (name && name.trim()) {
                    if (appData.panels[name.trim()]) {
                        toast.warning("Ya existe un panel con ese nombre.");
                        return;
                    }
                    const newName = name.trim();
                    const newAppData = {
                        ...appData,
                        panels: { ...appData.panels, [newName]: getDefaultPanelData() },
                    };
                    setCurrentPanelName(newName);
                    saveData(newAppData, newName, currentFilter);
                }
            },
        });
        setModalInputValue("");
        setModalOpen(true);
    };

    const handleDeletePanel = () => {
        if (Object.keys(appData.panels).length <= 1) {
            toast.warning("No se puede eliminar el último panel.");
            return;
        }
        setModalConfig({
            title: "Confirmar Eliminación",
            message: `¿Eliminar el panel "${currentPanelName}"? Esta acción no se puede deshacer.`,
            type: "confirm",
            icon: <Trash2 className="h-4 w-4 text-white" />,
            confirmLabel: "Eliminar",
            confirmVariant: "destructive",
            onConfirm: () => {
                const newPanels = { ...appData.panels };
                delete newPanels[currentPanelName];
                const newPanelName = Object.keys(newPanels)[0];
                const newAppData = { ...appData, panels: newPanels };
                setCurrentPanelName(newPanelName);
                saveData(newAppData, newPanelName, currentFilter);
            },
        });
        setModalOpen(true);
    };

    const handleResetPanel = () => {
        setModalConfig({
            title: "Confirmar Vaciado",
            message: `¿Vaciar el panel "${currentPanelName}"?`,
            type: "confirm",
            icon: <Zap className="h-4 w-4 text-white" />,
            confirmLabel: "Vaciar",
            confirmVariant: "destructive",
            onConfirm: () => {
                const newAppData = {
                    ...appData,
                    panels: { ...appData.panels, [currentPanelName]: getDefaultPanelData() },
                };
                saveData(newAppData, currentPanelName, currentFilter);
            },
        });
        setModalOpen(true);
    };

    const exportToXLSX = () => {
        toast.info("Generando archivo Excel...");
        const wb = XLSX.utils.book_new();
        const client = appData.clientInfo;
        const rack = appData.rack;

        const sheetData = [
            ["Informe de Patch Panel"],
            [],
            ["Cliente:", client.clientName],
            ["Proyecto:", client.projectName],
            ["Técnico:", client.technicianName],
            ["Rack:", `${rack.name} (${rack.height}U)`],
            ["Panel:", currentPanelName],
            [],
            ["Puerto", "Estado", "Conexión", "MAC", "Longitud (m)", "Observaciones", "Certificado", "PoE"],
        ];

        Object.entries(currentPanelData).forEach(([portId, data]) => {
            sheetData.push([
                portId,
                isPortUnpatched(data) ? UNPATCHED_STATE : "Ocupado",
                data.desc,
                data.mac,
                data.length,
                data.obs,
                data.certified ? "Sí" : "No",
                data.poe ? "Sí" : "No",
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, `Panel ${currentPanelName}`);
        XLSX.writeFile(wb, `Reporte_Panel_${currentPanelName.replace(/\s+/g, "_")}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const client = appData.clientInfo;
        const rack = appData.rack;

        doc.setFontSize(18);
        doc.text("Informe de Patch Panel", 14, 22);

        doc.setFontSize(11);
        doc.text(`Cliente: ${client.clientName}`, 14, 32);
        doc.text(`Proyecto: ${client.projectName}`, 14, 38);
        doc.text(`Técnico: ${client.technicianName}`, 14, 44);
        doc.text(`Rack: ${rack.name} (${rack.height}U)`, 14, 50);
        doc.text(`Panel: ${currentPanelName}`, 14, 56);

        const tableBody = Object.entries(currentPanelData).map(([portId, data]) => [
            portId,
            isPortUnpatched(data) ? UNPATCHED_STATE : "Ocupado",
            data.desc,
            data.mac,
            data.length,
            data.obs,
            data.certified ? "Sí" : "No",
            data.poe ? "Sí" : "No",
        ]);

        autoTable(doc, {
            startY: 65,
            head: [["Puerto", "Estado", "Conexión", "MAC", "Longitud", "Obs.", "Cert.", "PoE"]],
            body: tableBody,
        });

        doc.save(`Reporte_Panel_${currentPanelName.replace(/\s+/g, "_")}.pdf`);
    };

    useImperativeHandle(ref, () => ({
        resetPanel: handleResetPanel,
        exportPdf: exportToPDF,
        exportExcel: exportToXLSX,
    }));

    if (isLoading) return <div>Cargando implementación...</div>;

    return (
        <div className="space-y-4 p-1">
            <div className="grid gap-6 md:grid-cols-3">
                {/* Client Info Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-slate-500" />
                            Información de Implementación
                        </CardTitle>
                        <Button
                            variant={isEditingClient ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                if (isEditingClient) {
                                    saveData(appData, currentPanelName, currentFilter);
                                }
                                setIsEditingClient(!isEditingClient);
                            }}
                        >
                            {isEditingClient ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                            {isEditingClient ? "Guardar" : "Editar"}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                            <span className="font-medium text-muted-foreground">Fecha de instalación:</span>
                            {isEditingClient ? (
                                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Input
                                            className="col-span-2 cursor-pointer"
                                            readOnly
                                            value={
                                                formatInstallationDate(appData.clientInfo.installationDate) || ""
                                            }
                                            placeholder="Selecciona la fecha"
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={
                                                appData.clientInfo.installationDate
                                                    ? new Date(appData.clientInfo.installationDate)
                                                    : undefined
                                            }
                                            onSelect={(date) => handleDateSelect(date ?? undefined)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <span className="col-span-2 font-mono">
                                    {formatInstallationDate(appData.clientInfo.installationDate) || "—"}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <span className="font-medium text-muted-foreground">Técnico instalador:</span>
                            {isEditingClient ? (
                                <Input
                                    className="col-span-2"
                                    value={appData.clientInfo.installationTechnician}
                                    onChange={(e) =>
                                        setAppData({
                                            ...appData,
                                            clientInfo: {
                                                ...appData.clientInfo,
                                                installationTechnician: e.target.value,
                                            },
                                        })
                                    }
                                />
                            ) : (
                                <span className="col-span-2 font-mono">
                                    {appData.clientInfo.installationTechnician || "—"}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <span className="font-medium text-muted-foreground">Contacto en sitio:</span>
                            {isEditingClient ? (
                                <Input
                                    className="col-span-2"
                                    value={appData.clientInfo.onsiteContact}
                                    onChange={(e) =>
                                        setAppData({
                                            ...appData,
                                            clientInfo: { ...appData.clientInfo, onsiteContact: e.target.value },
                                        })
                                    }
                                />
                            ) : (
                                <span className="col-span-2 font-mono">
                                    {appData.clientInfo.onsiteContact || "—"}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Gallery Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Image className="h-4 w-4 text-slate-500" />
                            Galería
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className={`relative cursor-pointer rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${isDraggingGallery ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-white"
                                }`}
                            onClick={openGalleryInput}
                            onDragOver={handleGalleryDragOver}
                            onDragLeave={handleGalleryDragLeave}
                            onDrop={handleGalleryDrop}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className="rounded-full bg-slate-100 p-3">
                                    <Camera className="h-5 w-5 text-slate-500" />
                                </div>
                                <p className="text-base font-semibold text-slate-900">
                                    Arrastra imágenes o haz clic para subir
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Se mostrarán como miniaturas en esta tarjeta
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openGalleryInput();
                                    }}
                                >
                                    Seleccionar archivos
                                </Button>
                            </div>
                            <input
                                ref={galleryInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                            />
                        </div>
                        {galleryFiles.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {galleryFiles.map((file) => (
                                    <button
                                        key={file.id}
                                        type="button"
                                        className="group space-y-2 text-left"
                                        onClick={() => openGalleryModal(file)}
                                    >
                                        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                            <img
                                                src={file.preview}
                                                alt={file.name}
                                                className="h-32 w-full object-cover transition duration-200 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                                            <div className="h-1.5 w-full rounded-full bg-slate-200">
                                                <span
                                                    className="block h-full rounded-full bg-emerald-500"
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                {file.progress}% · {file.status === "uploading" ? "Subiendo" : "Completado"}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No hay imágenes cargadas todavía.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Rack Info Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Server className="h-4 w-4 text-slate-500" />
                            Detalles del Rack
                        </CardTitle>
                        <Button
                            variant={isEditingRack ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                if (isEditingRack) {
                                    saveData(appData, currentPanelName, currentFilter);
                                }
                                setIsEditingRack(!isEditingRack);
                            }}
                        >
                            {isEditingRack ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                            {isEditingRack ? "Guardar" : "Editar"}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-3 items-center gap-2">
                            <span className="font-medium text-muted-foreground">Nombre:</span>
                            {isEditingRack ? (
                                <Input
                                    className="col-span-2"
                                    value={appData.rack.name}
                                    onChange={(e) =>
                                        setAppData({
                                            ...appData,
                                            rack: { ...appData.rack, name: e.target.value },
                                        })
                                    }
                                />
                            ) : (
                                <span className="col-span-2 font-mono">{appData.rack.name}</span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <span className="font-medium text-muted-foreground">Altura (U):</span>
                            {isEditingRack ? (
                                <Select
                                    value={appData.rack.height.toString()}
                                    onValueChange={(val) =>
                                        setAppData({
                                            ...appData,
                                            rack: { ...appData.rack, height: parseInt(val) },
                                        })
                                    }
                                >
                                    <SelectTrigger className="col-span-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[6, 12, 24, 32, 42].map((h) => (
                                            <SelectItem key={h} value={h.toString()}>
                                                {h}U
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="col-span-2 font-mono">{appData.rack.height}U</span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <span className="font-medium text-muted-foreground">U Inicial:</span>
                            {isEditingRack ? (
                                <Input
                                    type="number"
                                    className="col-span-2"
                                    value={appData.rack.startU}
                                    onChange={(e) =>
                                        setAppData({
                                            ...appData,
                                            rack: { ...appData.rack, startU: parseInt(e.target.value) },
                                        })
                                    }
                                />
                            ) : (
                                <span className="col-span-2 font-mono">{appData.rack.startU}</span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                            <span className="font-medium text-muted-foreground">Marca:</span>
                            {isEditingRack ? (
                                <Input
                                    className="col-span-2"
                                    value={appData.rack.brand}
                                    onChange={(e) =>
                                        setAppData({
                                            ...appData,
                                            rack: { ...appData.rack, brand: e.target.value },
                                        })
                                    }
                                />
                            ) : (
                                <span className="col-span-2 font-mono">{appData.rack.brand || "—"}</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Patch Panel Visual */}
                <Card>
                    <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Network className="h-4 w-4 text-slate-500" />
                            Patch Panel Físico
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveData(appData, currentPanelName, currentFilter)}
                                title="Guardar implementación actual"
                            >
                                <Save className="mr-1 h-4 w-4" />
                                Guardar
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                                <a
                                    href={whatsappShareUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-slate-600"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    WhatsApp
                                </a>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                                <a
                                    href={emailShareUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-slate-600"
                                >
                                    <Mail className="h-4 w-4" />
                                    Email
                                </a>
                            </Button>
                            <Select value={currentPanelName} onValueChange={setCurrentPanelName}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(appData.panels).map((name) => (
                                        <SelectItem key={name} value={name}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="icon" variant="default" onClick={handleAddPanel}>
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="destructive" onClick={handleDeletePanel}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                <CardContent className="px-3 pb-2 pt-1">
                    <div className="bg-slate-100 rounded-xl shadow-inner p-1">
                        <div className="flex h-24 w-full gap-0.5">
                            {Array.from({ length: 24 }, (_, i) => i + 1).map((portNum) => {
                                const portId = portNum.toString();
                                const portInfo = currentPanelData[portId] || { desc: UNPATCHED_STATE };
                                const unpatched = isPortUnpatched(portInfo);
                                const connectionIcon = getConnectionIcon(portInfo.desc);

                                return (
                                    <div
                                        key={portId}
                                        className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-sm border border-slate-200 bg-white/90 px-1 py-1 text-center text-[10px] font-mono text-slate-500 transition-all duration-200 ${unpatched ? "opacity-75" : "shadow-sm"
                                            } hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg`}
                                        onClick={() => handlePortClick(portId)}
                                    >
                                        {connectionIcon && (
                                            <div className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow">
                                                {connectionIcon}
                                            </div>
                                        )}
                                        <img
                                            src="/assets/patchpanel/rj45.png"
                                            alt="RJ45"
                                            className={`h-6 w-6 object-contain pointer-events-none transition-all duration-200 ${unpatched ? "grayscale opacity-60" : "drop-shadow-lg group-hover:-translate-y-0.5"
                                                }`}
                                        />
                                        <span className="text-[10px] leading-none">{portNum}</span>
                                        {portInfo.poe && (
                                            <div className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Connection Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Tabla de Conexiones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentFilter === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                    }`}
                                onClick={() => setCurrentFilter("all")}
                            >
                                Todos
                            </button>
                            <button
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentFilter === "occupied" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                    }`}
                                onClick={() => setCurrentFilter("occupied")}
                            >
                                Ocupados
                            </button>
                            <button
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${currentFilter === "unpatched" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                    }`}
                                onClick={() => setCurrentFilter("unpatched")}
                            >
                                Libres
                            </button>
                        </div>
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en el panel..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="h-8 px-2 text-left font-medium text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Circle className="h-3.5 w-3.5 text-slate-400" />
                                            P.
                                        </div>
                                    </th>
                                    <th className="h-8 px-2 text-left font-medium text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Circle className="h-3.5 w-3.5 text-slate-400" />
                                            Estado
                                        </div>
                                    </th>
                                    <th className="h-8 px-2 text-left font-medium text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Server className="h-3.5 w-3.5 text-slate-400" />
                                            Conexión
                                        </div>
                                    </th>
                                    <th className="h-8 px-2 text-left font-medium text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Monitor className="h-3.5 w-3.5 text-slate-400" />
                                            MAC
                                        </div>
                                    </th>
                                    <th className="h-8 px-2 text-left font-medium text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Circle className="h-3.5 w-3.5 text-slate-400" />
                                            Long.
                                        </div>
                                    </th>
                                    <th className="h-8 px-2 text-left font-medium text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                                            Obs.
                                        </div>
                                    </th>
                                    <th className="h-8 px-2 text-center font-medium text-slate-500">
                                        <div className="flex items-center justify-center gap-1">
                                            <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                                            Cert.
                                        </div>
                                    </th>
                                    <th className="h-8 px-2 text-center font-medium text-slate-500">
                                        <div className="flex items-center justify-center gap-1">
                                            <Zap className="h-3.5 w-3.5 text-slate-400" />
                                            PoE
                                        </div>
                                    </th>
                                    <th className="h-8 px-2 text-right font-medium text-slate-500">
                                        <div className="flex items-center justify-end gap-1">
                                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                                            Acciones
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(currentPanelData)
                                    .filter(([portId, portInfo]) => {
                                        const unpatched = isPortUnpatched(portInfo);
                                        if (currentFilter === "occupied" && unpatched) return false;
                                        if (currentFilter === "unpatched" && !unpatched) return false;
                                        if (searchTerm) {
                                            const search = searchTerm.toLowerCase();
                                            return (
                                                portId.includes(search) ||
                                                (portInfo.desc || "").toLowerCase().includes(search) ||
                                                (portInfo.mac || "").toLowerCase().includes(search) ||
                                                (portInfo.obs || "").toLowerCase().includes(search)
                                            );
                                        }
                                        return true;
                                    })
                                    .map(([portId, portInfo]) => {
                                        const unpatched = isPortUnpatched(portInfo);
                                        return (
                                            <tr key={portId} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-1.5 font-mono">{portId}</td>
                                                <td className="p-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`w-2.5 h-2.5 rounded-full ${unpatched ? "bg-red-500" : "bg-green-500"
                                                                }`}
                                                        />
                                                        {unpatched ? UNPATCHED_STATE : "Ocupado"}
                                                    </div>
                                                </td>
                                                <td className="p-1.5 font-medium">
                                                    <div className="flex items-center gap-1">
                                                        {getConnectionIcon(portInfo.desc)}
                                                        <span>{portInfo.desc}</span>
                                                    </div>
                                                </td>
                                                    <td className="p-1.5 font-mono text-xs">{portInfo.mac}</td>
                                                    <td className="p-1.5">{portInfo.length}</td>
                                                    <td className="p-1.5 max-w-[200px] truncate" title={portInfo.obs}>
                                                    {portInfo.obs}
                                                </td>
                                                    <td className="p-1.5 text-center">
                                                    {portInfo.certified && <CheckCircle className="h-4 w-4 text-green-600 inline" />}
                                                </td>
                                                    <td className="p-1.5 text-center">
                                                    {portInfo.poe && <Zap className="h-4 w-4 text-amber-500 inline" />}
                                                </td>
                                                    <td className="p-1.5 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handlePortClick(portId)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Port Edit Popover/Dialog */}
            <Dialog open={popoverOpen} onOpenChange={setPopoverOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <DialogHeader className="pb-2">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-slate-100 p-2 shadow-inner">
                                <Network className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-3 h-3 rounded-full ${activePortStatus ? "bg-red-500" : "bg-green-500"}`}
                                    />
                                    <DialogTitle className="text-lg font-semibold tracking-tight">
                                        Puerto {activePortId}
                                    </DialogTitle>
                                </div>
                                <p className="text-xs text-muted-foreground">Actualiza la conexión del puerto</p>
                            </div>
                        </div>
                    </DialogHeader>
                    {activePortId && (
                        <PortEditForm
                            portInfo={currentPanelData[activePortId]}
                            onSave={(newData) => handleSavePort(activePortId, newData)}
                            onCancel={() => setPopoverOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Gallery preview modal */}
            <Dialog open={galleryModalOpen} onOpenChange={setGalleryModalOpen}>
                <DialogContent className="sm:max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-slate-100 p-2 shadow-inner">
                                <Camera className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold">
                                    {selectedGalleryFile?.name || "Galería"}
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground">
                                    {selectedGalleryFile?.status === "uploading"
                                        ? "Subiendo imagen..."
                                        : "Vista previa"}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    {selectedGalleryFile && (
                        <div className="space-y-4">
                            <div className="max-h-[60vh] overflow-hidden rounded-2xl bg-slate-900">
                                <img
                                    src={selectedGalleryFile.preview}
                                    alt={selectedGalleryFile.name}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold">{selectedGalleryFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Estado: {selectedGalleryFile.status === "uploading" ? "Subiendo" : "Listo"}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setGalleryModalOpen(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-3xl border border-slate-200 bg-white/95 shadow-2xl">
                    <DialogHeader className="space-y-3 pb-1">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-2 shadow-lg">
                                {modalConfig.icon ?? <AlertTriangle className="h-4 w-4 text-white" />}
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold">{modalConfig.title}</DialogTitle>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    {modalConfig.type === "prompt" ? "Entrada" : "Confirmación"}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-600">{modalConfig.message}</p>
                        {modalConfig.type === "prompt" && (
                            <Input
                                value={modalInputValue}
                                onChange={(e) => setModalInputValue(e.target.value)}
                                placeholder="Ingrese un valor..."
                                className="border-slate-200 bg-white/90 px-3 py-2"
                            />
                        )}
                    </div>
                    <DialogFooter className="pt-0 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setModalOpen(false);
                                setModalInputValue("");
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant={modalConfig.confirmVariant ?? "default"}
                            onClick={() => {
                                modalConfig.onConfirm(modalInputValue);
                                setModalOpen(false);
                                setModalInputValue("");
                            }}
                        >
                            {modalConfig.confirmLabel ?? (modalConfig.type === "prompt" ? "Guardar" : "Confirmar")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});

function PortEditForm({
    portInfo,
    onSave,
    onCancel,
}: {
    portInfo: PortInfo;
    onSave: (data: PortInfo) => void;
    onCancel: () => void;
}) {
    const [data, setData] = useState(portInfo);

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">
                    <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-600">
                        <Server className="h-4 w-4" />
                        Conexión
                    </div>
                </Label>
                <Select
                    value={data.desc}
                    onValueChange={(val) => setData({ ...data, desc: val })}
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {connectionTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mac" className="text-right">
                    <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-600">
                        <Monitor className="h-4 w-4" />
                        MAC
                    </div>
                </Label>
                <Input
                    id="mac"
                    value={data.mac}
                    onChange={(e) => setData({ ...data, mac: e.target.value })}
                    className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="length" className="text-right">
                    <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-600">
                        <Circle className="h-4 w-4" />
                        Longitud (m)
                    </div>
                </Label>
                <Input
                    id="length"
                    value={data.length}
                    onChange={(e) => setData({ ...data, length: e.target.value })}
                    className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="obs" className="text-right">
                    <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-600">
                        <FileText className="h-4 w-4" />
                        Obs.
                    </div>
                </Label>
                <Input
                    id="obs"
                    value={data.obs}
                    onChange={(e) => setData({ ...data, obs: e.target.value })}
                    className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <CheckCircle className="h-4 w-4" />
                        Certificado
                    </div>
                    <Switch
                        id="certified"
                        checked={!!data.certified}
                        onCheckedChange={(checked) => setData({ ...data, certified: !!checked })}
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Zap className="h-4 w-4" />
                        PoE Habilitado
                    </div>
                    <Switch
                        id="poe"
                        checked={!!data.poe}
                        onCheckedChange={(checked) => setData({ ...data, poe: !!checked })}
                    />
                </div>
            </div>
            <DialogFooter className="px-0 pt-4 gap-3 justify-end">
                <Button variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={() => onSave(data)}>Guardar</Button>
            </DialogFooter>
        </div>
    );
}
