"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createBudgetItem,
  deleteBudgetItem,
  fetchBudgetById,
  fetchBudgetItems,
  shareBudgetPdf,
  uploadBudgetCover,
  updateBudget,
  updateBudgetItem,
} from "@/lib/api-budgets";
import { fetchAllClients } from "@/lib/api-clients";
import { fetchAllProducts } from "@/lib/api-products";
import { Budget } from "@/types/budget";
import { BudgetItem } from "@/types/budget-item";
import { BudgetSection } from "@/types/budget-section";
import { Client } from "@/types/client";
import { Product } from "@/types/product";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
  AlignLeft,
  ArrowLeft,
  CheckCircle,
  CloudUpload,
  DollarSign,
  FileText,
  GripVertical,
  Mail,
  MessageCircle,
  Search,
  Tag,
  Trash2,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { BudgetPdfPreview } from "@/components/budgets/budget-pdf-preview";
import { API_URL } from "@/lib/http";

const budgetStatuses = ["Nuevo", "Enviado", "Aprobado", "Rechazado"];

const createDefaultSections = (description?: string): BudgetSection[] => [
  { id: "resumen", title: "Resumen ejecutivo", content: description || "Describe el objetivo y resultados esperados." },
  { id: "alcance", title: "Alcance del servicio", content: "Detalla entregables, ventanas de atención y criterios de aceptación." },
  { id: "terminos", title: "Términos y condiciones", content: "Incluye formas de pago, garantías y responsabilidades." },
];


const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }
      if (typeof reader.result === "string") {
        resolve(new TextEncoder().encode(reader.result).buffer);
        return;
      }
      reject(new Error("No se pudo leer el archivo"));
    };
    reader.onerror = () => {
      reject(reader.error || new Error("No se pudo leer el archivo"));
    };
    reader.readAsArrayBuffer(file);
  });

export default function EditBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  if (!rawId) {
    throw new Error("Budget ID is required.");
  }
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Nuevo");
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [sections, setSections] = useState<BudgetSection[]>(createDefaultSections(""));
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [rowFormValues, setRowFormValues] = useState<Record<string, { quantity: number; unitPrice: number }>>({});
  const [rowStatus, setRowStatus] = useState<Record<string, "idle" | "saving" | "deleting">>({});
  const [contactNote, setContactNote] = useState("");
  const [customContactNote, setCustomContactNote] = useState(false);
  const [sharedPdfUrl, setSharedPdfUrl] = useState<string | null>(null);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const defaultCoverUrl = "/presu-01.pdf";
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(defaultCoverUrl);
  const [coverEnabled, setCoverEnabled] = useState(true);
  const [coverName, setCoverName] = useState("Portada oficial");
  const [coverFileData, setCoverFileData] = useState<ArrayBuffer | null>(null);
  const previousCoverRef = useRef<string | null>(defaultCoverUrl);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTimerRef = useRef<number | null>(null);

  const previewRef = useRef<{ generate: () => Promise<Blob | null> } | null>(null);

  const itemsTotal = useMemo(() => items.reduce((sum, item) => sum + (item.total || item.quantity * item.unitPrice), 0), [items]);

  useEffect(() => {
    setAmount(itemsTotal);
  }, [itemsTotal]);

  useEffect(() => {
    if (!budget) return;
    if (customContactNote) return;
    const amountText = amount ? `$${amount.toFixed(2)}` : "Monto pendiente";
    const defaultMessage = `Hola ${budget.clientName || "cliente"},\nTe comparto el presupuesto "${budget.title}" por ${amountText}. Quedo atento a cualquier consulta.`;
    setContactNote(defaultMessage);
  }, [budget, amount, customContactNote]);

  useEffect(() => {
    setCustomContactNote(false);
  }, [budget?.id]);

  const loadItems = useCallback(async () => {
    if (!id) return;
    try {
      const fetchedItems = await fetchBudgetItems(id);
      setItems(fetchedItems);
    } catch (error) {
      console.error("Budget items error:", error);
    }
  }, [id]);

  const loadBudget = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const fetchedBudget = await fetchBudgetById(id);
      setBudget(fetchedBudget);
      setTitle(fetchedBudget.title);
      setDescription(fetchedBudget.description || "");
      setStatus(fetchedBudget.status || "Nuevo");
      setAmount(fetchedBudget.amount || 0);
      const serverSections = Array.isArray(fetchedBudget.sections) && fetchedBudget.sections.length
        ? fetchedBudget.sections
        : createDefaultSections(fetchedBudget.description);
      setSections(serverSections);
      const coverUrl = fetchedBudget.filePath || defaultCoverUrl;
      setCoverPreviewUrl(coverUrl);
      setCoverName(coverUrl === defaultCoverUrl ? "Portada oficial" : coverUrl.split("/").pop() || "Portada oficial");
      const fetchedItems = await fetchBudgetItems(id);
      setItems(fetchedItems);
    } catch (error) {
      toast.error("No se pudo cargar el presupuesto.");
      console.error("Budget load error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadProducts = useCallback(async () => {
    try {
      const fetchedProducts = await fetchAllProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("No se pudieron cargar los productos", error);
      toast.error("No se pudo cargar el catálogo de productos.");
    }
  }, []);

  useEffect(() => {
    loadBudget();
    loadProducts();
  }, [loadBudget, loadProducts]);

  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const product = products.find((prd) => prd.id === item.productId);
      return { ...item, productName: product?.name || "" };
    });
  }, [items, products]);
  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      try {
        const data = await fetchAllClients();
        if (!cancelled) {
          setClients(data);
        }
      } catch (error) {
        console.error("Clients load error:", error);
        toast.error("No se pudieron cargar los clientes.");
      } finally {
        if (!cancelled) {
          setClientsLoading(false);
        }
      }
    };
    loadClients();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (budget) {
      setSelectedClientId(budget.clientId);
    }
  }, [budget]);

  useEffect(() => {
    if (
      previousCoverRef.current &&
      previousCoverRef.current !== coverPreviewUrl &&
      previousCoverRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(previousCoverRef.current);
    }
    previousCoverRef.current = coverPreviewUrl;
  }, [coverPreviewUrl]);

  useEffect(() => {
    // Skip download for blob URLs or empty values
    if (!coverPreviewUrl || coverPreviewUrl.startsWith("blob:")) {
      return;
    }

    // For default cover, load it from public folder
    if (coverPreviewUrl === defaultCoverUrl) {
      fetch(defaultCoverUrl)
        .then(response => {
          if (!response.ok) throw new Error("Default cover not found");
          return response.arrayBuffer();
        })
        .then(buffer => setCoverFileData(buffer))
        .catch(error => {
          console.warn("Could not load default cover:", error);
          // It's okay if default cover is not found, PDF will work without it
        });
      return;
    }

    // For custom covers from server
    let cancelled = false;
    const controller = new AbortController();
    const downloadUrl =
      coverPreviewUrl.startsWith("http") ? coverPreviewUrl : `${API_URL}${coverPreviewUrl}`;

    const fetchCover = async () => {
      try {
        const response = await fetch(downloadUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: No se pudo descargar la portada.`);
        }
        const buffer = await response.arrayBuffer();
        if (!cancelled) {
          setCoverFileData(buffer);
        }
      } catch (error) {
        if (!cancelled && (error as any)?.name !== 'AbortError') {
          console.warn("Cover download failed, falling back to default:", error);
          // Fallback to default cover if custom cover fails
          setCoverPreviewUrl(defaultCoverUrl);
          setCoverName("Portada oficial");
        }
      }
    };

    fetchCover();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    return () => {
      if (previousCoverRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previousCoverRef.current);
      }
      if (uploadTimerRef.current) {
        window.clearInterval(uploadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSharedPdfUrl(null);
  }, [id]);

  useEffect(() => {
    setRowFormValues((prev) => {
      const next = { ...prev };
      products.forEach((product) => {
        const existing = items.find(
          (item) => item.productId === product.id || item.description === product.name
        );
        const quantity = existing?.quantity ?? 0;
        const unitPrice = existing?.unitPrice ?? product.priceUYU;
        const current = prev[product.id];
        if (!current || current.quantity !== quantity || current.unitPrice !== unitPrice) {
          next[product.id] = { quantity, unitPrice };
        }
      });
      return next;
    });
  }, [products, items]);

  const itemsWithProduct = (product: Product) =>
    items.find((item) => item.productId === product.id || item.description === product.name);

  const filteredProducts = useMemo(() => {
    const term = catalogSearch.toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.manufacturer.toLowerCase().includes(term)
    );
  }, [catalogSearch, products]);

  const handleSectionFieldChange = (sectionId: string, field: "title" | "content", value: string) => {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, [field]: value } : section)));
  };

  const handleSectionRemove = (sectionId: string) => {
    setSections((prev) => (prev.length === 1 ? prev : prev.filter((section) => section.id !== sectionId)));
  };

  const handleDragStart = (sectionId: string) => setDraggedSectionId(sectionId);
  const handleDragOver = (event: React.DragEvent) => event.preventDefault();
  const handleDrop = (targetId: string) => {
    if (!draggedSectionId || draggedSectionId === targetId) return;
    const sourceIndex = sections.findIndex((section) => section.id === draggedSectionId);
    const targetIndex = sections.findIndex((section) => section.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setSections(reordered);
    setDraggedSectionId(null);
  };
  const dragEnd = () => setDraggedSectionId(null);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!coverEnabled) {
      toast.error("Primero activa la portada editable.");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    await applyCoverFile(file);
    try {
      const result = await uploadBudgetCover(id, file);
      setCoverPreviewUrl(result.url);
      setCoverName(file.name);
    } catch (error) {
      console.error("Cover upload error:", error);
      toast.error("La portada se cargó localmente, pero no se guardó en el servidor.");
    }
  };

  const handleCoverDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!coverEnabled) {
      return;
    }
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await applyCoverFile(file);
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    if (uploadTimerRef.current) {
      window.clearInterval(uploadTimerRef.current);
    }
    uploadTimerRef.current = window.setInterval(() => {
      setUploadProgress((prev) => {
        const next = Math.min(100, prev + 15);
        if (next === 100 && uploadTimerRef.current) {
          window.clearInterval(uploadTimerRef.current);
        }
        return next;
      });
    }, 120);
  };

  const applyCoverFile = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setCoverPreviewUrl(preview);
    setCoverName(file.name);
    simulateProgress();
    try {
      const buffer = await readFileAsArrayBuffer(file);
      setCoverFileData(buffer);
    } catch (error) {
      toast.error("No se pudo leer la portada.");
      console.error("Cover read error:", error);
    }
  };

  const handleResetCover = () => {
    setCoverPreviewUrl(defaultCoverUrl);
    setCoverName("Portada oficial");
    setCoverFileData(null);
    setUploadProgress(0);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const selected = clients.find((client) => client.id === clientId);
    if (selected && budget) {
      setBudget({
        ...budget,
        clientId: selected.id,
        clientName: selected.name,
        clientEmail: selected.email,
        clientPhone: selected.phone,
      });
    }
  };

  const getShareLink = useCallback(
    () => (typeof window !== "undefined" ? window.location.href : ""),
    []
  );

  const buildSharedMessage = useCallback(
    (shareUrl?: string) => {
      const link = shareUrl || getShareLink();
      return `${contactNote}\n\nVer presupuesto: ${link}`;
    },
    [contactNote, getShareLink]
  );

  const ensureSharedPdfUrl = useCallback(async () => {
    if (sharedPdfUrl) return sharedPdfUrl;
    if (!previewRef.current) throw new Error("La vista previa no está disponible.");
    setSharingPdf(true);
    try {
      const pdfBlob = await previewRef.current.generate();
      if (!pdfBlob) throw new Error("No se pudo generar el PDF.");
      const result = await shareBudgetPdf(id, pdfBlob);
      setSharedPdfUrl(result.url);
      return result.url;
    } finally {
      setSharingPdf(false);
    }
  }, [id, previewRef, sharedPdfUrl]);

  const handleSendEmail = async () => {
    if (!budget?.clientEmail) {
      toast.error("Registra un email del cliente para enviar el presupuesto.");
      return;
    }
    if (typeof window === "undefined") {
      toast.error("No se puede abrir el correo en este entorno.");
      return;
    }
    try {
      const shareUrl = await ensureSharedPdfUrl();
      const subject = encodeURIComponent(`Presupuesto ${budget.title}`);
      const body = encodeURIComponent(`${buildSharedMessage(shareUrl)}\nPDF: ${shareUrl}`);
      window.open(`mailto:${budget.clientEmail}?subject=${subject}&body=${body}`, "_blank");
    } catch (error) {
      console.error("Email share error:", error);
      toast.error("No se pudo preparar el PDF para compartir.");
    }
  };

  const handleSendWhatsApp = async () => {
    if (!budget?.clientPhone) {
      toast.error("Registra un teléfono para enviar por WhatsApp.");
      return;
    }
    const digits = budget.clientPhone.replace(/\D/g, "");
    if (!digits) {
      toast.error("El teléfono no tiene un formato válido.");
      return;
    }
    if (typeof window === "undefined") {
      toast.error("No se puede abrir WhatsApp en este entorno.");
      return;
    }
    try {
      const shareUrl = await ensureSharedPdfUrl();
      const body = encodeURIComponent(`${buildSharedMessage(shareUrl)}\nPDF: ${shareUrl}`);
      window.open(`https://wa.me/${digits}?text=${body}`, "_blank");
    } catch (error) {
      console.error("WhatsApp share error:", error);
      toast.error("No se pudo preparar el PDF para compartir.");
    }
  };

  const submitBudget = async () => {
    setSaving(true);
    if (!budget) {
      toast.error("No se encontró el presupuesto activo.");
      setSaving(false);
      return;
    }
    try {
      await syncCatalogChanges();
      const result = await updateBudget(id, {
        title,
        description,
        status,
        amount,
        clientId: selectedClientId || budget.clientId,
        sections,
      });
      setBudget(result);
      setTitle(result.title);
      setDescription(result.description || "");
      setStatus(result.status || "Nuevo");
      setAmount(result.amount || 0);
      const refreshedSections = Array.isArray(result.sections) && result.sections.length
        ? result.sections
        : createDefaultSections(result.description);
      setSections(refreshedSections);
      previewRef.current?.generate();
      toast.success("Presupuesto actualizado.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitBudget();
  };

  const updateRowValue = (productId: string, field: "quantity" | "unitPrice", value: number) => {
    setRowFormValues((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleProductSave = async (product: Product, existingItem?: BudgetItem) => {
    const form = rowFormValues[product.id] || { quantity: 0, unitPrice: product.priceUYU };
    if (form.quantity <= 0) {
      toast.error("Ingresa una cantidad válida.");
      return;
    }
    setRowStatus((prev) => ({ ...prev, [product.id]: "saving" }));
    try {
      const payload = {
        description: product.name,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        productId: product.id,
      };
      if (existingItem) {
        await updateBudgetItem(existingItem.id, payload);
        toast.success("Item actualizado.");
      } else {
        await createBudgetItem(id, payload);
        toast.success("Item agregado al presupuesto.");
      }
      await loadItems();
    } catch (error) {
      console.error("Catalog save error:", error);
      toast.error("No se pudo guardar el ítem.");
    } finally {
      setRowStatus((prev) => ({ ...prev, [product.id]: "idle" }));
    }
  };

  const syncCatalogChanges = useCallback(async () => {
    for (const product of products) {
      const form = rowFormValues[product.id];
      const existing = itemsWithProduct(product);
      if (!form) continue;
      const qty = Number(form.quantity);
      const price = Number(form.unitPrice);
      if (qty <= 0) {
        if (existing) {
          await deleteBudgetItem(existing.id);
        }
        continue;
      }
      const payload = {
        description: product.name,
        quantity: qty,
        unitPrice: price,
        productId: product.id,
      };
      if (existing) {
        if (existing.quantity !== qty || existing.unitPrice !== price) {
          await updateBudgetItem(existing.id, payload);
        }
      } else {
        await createBudgetItem(id, payload);
      }
    }
    await loadItems();
  }, [products, rowFormValues, itemsWithProduct, id, loadItems]);

  const handleProductDelete = async (item: BudgetItem, productId: string) => {
    setRowStatus((prev) => ({ ...prev, [productId]: "deleting" }));
    try {
      await deleteBudgetItem(item.id);
      toast.success("Item eliminado.");
      await loadItems();
    } catch (error) {
      console.error("Catalog delete error:", error);
      toast.error("No se pudo eliminar el ítem.");
    } finally {
      setRowStatus((prev) => ({ ...prev, [productId]: "idle" }));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mr-2" />Cargando presupuesto...</div>
      </DashboardLayout>
    );
  }

  if (!budget) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">Presupuesto no encontrado.</div>
      </DashboardLayout>
    );
  }

  const headerClientName =
    clients.find((client) => client.id === selectedClientId)?.name ||
    budget.clientName ||
    "Cliente";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Editar Presupuesto"
          subtitle={`ID: ${budget.id} • Cliente: ${headerClientName}`}
          backHref="/budgets"
          leadingIcon={<FileText className="h-6 w-6 text-slate-800" />}
          breadcrumbs={[
            { label: "Presupuestos", href: "/budgets", icon: <FileText className="h-3 w-3 text-slate-500" /> },
            { label: `Presupuesto ${budget.id}`, icon: <Tag className="h-3 w-3 text-slate-500" /> },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details" className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="catalog" className="flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  Catálogo de productos
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Diseño del PDF
                </TabsTrigger>
                <TabsTrigger value="cover" className="flex items-center gap-1">
                  <CloudUpload className="h-4 w-4" />
                  Portada y branding
                </TabsTrigger>
                <TabsTrigger value="send" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Enviar presupuesto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader className="flex items-center justify-between gap-6">
                    <div>
                      <CardTitle>Información del presupuesto</CardTitle>
                      <p className="text-xs text-muted-foreground">Actualiza el título, estado y monto sin salir del presupuesto.</p>
                    </div>
                    <Button form="budget-form" type="submit" disabled={saving} className="whitespace-nowrap">
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <form id="budget-form" onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Estado</Label>
                          <div className="relative">
                            <CheckCircle className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Select value={status} onValueChange={(value) => setStatus(value)}>
                              <SelectTrigger className="pl-8">
                                <SelectValue placeholder="Selecciona un estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {budgetStatuses.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Monto (UYU)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(Number(e.target.value))}
                              className="pl-8"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                    <div className="mt-8 space-y-4 text-slate-900">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-black text-base">Portada editable</CardTitle>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={coverEnabled}
                            onChange={(event) => setCoverEnabled(event.target.checked)}
                            className="h-3 w-3 rounded border border-slate-400 text-slate-900 focus:ring-0"
                          />
                          {coverEnabled ? "Activo" : "Desactivado"}
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Controla título y cliente que se superponen sobre la portada del PDF.
                      </p>
                      <div className="grid gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Título de portada</p>
                          <Input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className="bg-white/90 text-slate-900"
                            disabled={!coverEnabled}
                          />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cliente</p>
                          <Select
                            value={selectedClientId || ""}
                            onValueChange={(value) => handleClientSelect(value)}
                            disabled={!coverEnabled || !clients.length}
                          >
                            <SelectTrigger className="bg-white/90 text-slate-900">
                              <SelectValue placeholder={clientsLoading ? "Cargando clientes..." : "Selecciona un cliente"} />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div
                        className={`group relative ${coverEnabled ? "bg-slate-50" : "bg-slate-100 opacity-70"
                          } px-4 py-6 text-center`}
                        onDragOver={(event) => {
                          if (coverEnabled) event.preventDefault();
                        }}
                        onDrop={(event) => {
                          if (coverEnabled) {
                            event.preventDefault();
                            handleCoverDrop(event as React.DragEvent<HTMLDivElement>);
                          }
                        }}
                      >
                        <CloudUpload className="mx-auto mb-2 h-6 w-6 text-slate-500" />
                        <p className="text-sm font-semibold text-slate-800">Arrastra un PDF o haz clic para subirlo</p>
                        <p className="text-xs text-muted-foreground">Usaremos este PDF como fondo de la primera hoja.</p>
                        <input
                          id="cover-input"
                          type="file"
                          accept="application/pdf"
                          onChange={handleCoverUpload}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          disabled={!coverEnabled}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!coverEnabled) return;
                            const input = document.getElementById("cover-input");
                            if (input) {
                              (input as HTMLInputElement).click();
                            }
                          }}
                          disabled={!coverEnabled}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Cambiar portada
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleResetCover} disabled={!coverEnabled}>
                          Restablecer portada oficial
                        </Button>
                      </div>
                      {uploadProgress > 0 && (
                        <div className="space-y-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-xs font-semibold text-emerald-600">{uploadProgress}% cargado</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="catalog">
                <Card>
                  <CardHeader>
                    <CardTitle>Catálogo compartido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-background p-4 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">Busca un producto o servicio</p>
                          <p className="text-xs text-muted-foreground">Controla cantidad y precio desde esta tabla integrada.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Search className="h-4 w-4" />
                          <Input
                            placeholder="Buscar..."
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="max-h-[520px] w-full">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Fabricante</TableHead>
                            <TableHead>Precios</TableHead>
                            <TableHead className="w-24">Cantidad</TableHead>
                            <TableHead className="w-32">P. Unit.</TableHead>
                            <TableHead className="w-28">Total</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => {
                            const item = itemsWithProduct(product);
                            const form = rowFormValues[product.id] || { quantity: 0, unitPrice: product.priceUYU };
                            const status = rowStatus[product.id] ?? "idle";
                            return (
                              <TableRow key={product.id}>
                                <TableCell className="flex items-center gap-3">
                                  <div className="h-10 w-10 overflow-hidden rounded-lg border bg-neutral-50">
                                    {product.imageUrl ? (
                                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                        <ImageIcon className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.description}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{product.manufacturer}</TableCell>
                                <TableCell className="space-y-1">
                                  <Badge className="text-[10px] px-2 py-0.5">{product.badge}</Badge>
                                  <div className="flex gap-2 text-xs text-muted-foreground">
                                    <span>${product.priceUYU} UYU</span>
                                    <span>${product.priceUSD} USD</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={form.quantity}
                                    onChange={(e) => updateRowValue(product.id, "quantity", Number(e.target.value))}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={form.unitPrice}
                                    onChange={(e) => updateRowValue(product.id, "unitPrice", Number(e.target.value))}
                                  />
                                </TableCell>
                                <TableCell>
                                  ${(form.quantity * form.unitPrice).toFixed(2)}
                                </TableCell>
                                <TableCell className="flex flex-wrap justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleProductSave(product, item)}
                                    disabled={status !== "idle"}
                                  >
                                    {item ? "Actualizar" : "Agregar"}
                                  </Button>
                                  {item && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleProductDelete(item, product.id)}
                                      disabled={status !== "idle"}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {filteredProducts.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-xs text-muted-foreground">
                                No hay productos que coincidan con la búsqueda.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pdf">
                <Card>
                  <CardHeader>
                    <CardTitle>Diseño del PDF</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {sections.map((section) => (
                        <div
                          key={section.id}
                          draggable
                          onDragStart={() => handleDragStart(section.id)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(section.id)}
                          onDragEnd={dragEnd}
                          className={cn(
                            "space-y-3 rounded-2xl border bg-white/80 p-4 shadow-sm transition-colors",
                            draggedSectionId === section.id ? "border-sky-500 ring-1 ring-sky-100" : "border-slate-200"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="cursor-grab text-muted-foreground" aria-label="Arrastra para reordenar" />
                              <Input
                                value={section.title}
                                onChange={(e) => handleSectionFieldChange(section.id, "title", e.target.value)}
                                placeholder="Título de sección"
                                className="flex-1"
                              />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleSectionRemove(section.id)} disabled={sections.length === 1}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <RichTextEditor value={section.content} onChange={(value) => handleSectionFieldChange(section.id, "content", value)} placeholder="Describe el contenido que aparecerá en esta hoja" className="min-h-[140px]" />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => setSections((prev) => [...prev, { id: `custom-${Date.now()}`, title: `Sección ${prev.length + 1}`, content: "" }])}>
                        <Tag className="mr-2 h-4 w-4" />
                        Agregar sección
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>


              <TabsContent value="cover">
                <Card>
                  <CardHeader>
                    <CardTitle>Portada y branding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      La portada reemplaza la primera hoja y reutiliza la información del presupuesto para el encabezado principal.
                    </p>
                    <div
                      className="group relative rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-slate-400"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleCoverDrop}
                    >
                      <CloudUpload className="mx-auto mb-3 h-6 w-6 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-800">Arrastra un PDF o haz clic para buscar</p>
                      <p className="text-xs text-muted-foreground">Aceptamos PDF con la portada del presupuesto.</p>
                      <input
                        id="cover-input"
                        type="file"
                        accept="application/pdf"
                        onChange={handleCoverUpload}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                      {uploadProgress > 0 && (
                        <div className="mt-4 space-y-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs font-semibold text-emerald-600">{uploadProgress}% cargado</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Portada actual: {coverName}</p>
                      {coverFileData && (
                        <a
                          href={coverPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                        >
                          Ver archivo cargado
                        </a>
                      )}
                      <Button variant="outline" size="sm" onClick={handleResetCover}>
                        Restaurar portada oficial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="send">
                <Card>
                  <CardHeader>
                    <CardTitle>Enviar presupuesto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={contactNote}
                      onChange={(event) => {
                        setContactNote(event.target.value);
                        setCustomContactNote(true);
                      }}
                      className="min-h-[160px]"
                      placeholder="Escribe un mensaje personalizado para el cliente..."
                    />
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {budget.clientEmail || "Email no registrado"}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        {budget.clientPhone || "Teléfono no registrado"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={handleSendEmail} disabled={!budget.clientEmail || sharingPdf}>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar por correo
                      </Button>
                      <Button variant="outline" onClick={handleSendWhatsApp} disabled={!budget.clientPhone || sharingPdf}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Enviar por WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>

          <div className="space-y-4">
            <Card className="h-full">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Vista previa profesional</CardTitle>
                  <p className="text-xs text-muted-foreground">Vea su presupuesto antes de ser enviado.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => previewRef.current?.generate()}>
                    Actualizar PDF
                  </Button>
                  <Button
                    variant="secondary"
                    className="bg-slate-600 text-white hover:bg-slate-500 whitespace-nowrap"
                    onClick={() => setConfirmSaveOpen(true)}
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <BudgetPdfPreview
                  ref={previewRef}
                  budget={budget}
                  items={enrichedItems}
                  sections={sections}
                  autoGenerate
                  coverFileData={coverFileData}
                  headerTitle={title}
                  headerClientName={headerClientName}
                  headerStatus={status}
                />
              </CardContent>
            </Card>
          </div>
          <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirmar guardado</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                ¿Querés guardar los cambios sin salir de esta ficha?
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirmSaveOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    setConfirmSaveOpen(false);
                    await submitBudget();
                  }}
                >
                  Guardar y permanecer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
