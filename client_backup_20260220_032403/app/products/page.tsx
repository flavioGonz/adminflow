"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedTableBody, AnimatedRow } from "@/hooks/use-table-animation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Product } from "@/types/product";
import { fetchAllProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api-products";
import { toast } from "sonner";
import { Activity, Banknote, ImageIcon, Layers, Search, Star, Tag, Edit3, Trash2, Package, Filter, Calendar, Coins, Factory, FolderTree, Plus, Truck, Loader2 } from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactCountryFlag from "react-country-flag";
import { cn } from "@/lib/utils";
import {
  fetchManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer as deleteManufacturerEntry,
  ManufacturerEntry,
} from "@/lib/api-manufacturers";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory as deleteCategoryEntry,
  CategoryEntry,
} from "@/lib/api-categories";
import {
  fetchSupplierCatalog,
  createSupplierCatalogEntry,
  updateSupplierCatalogEntry,
  deleteSupplierCatalogEntry,
  SupplierCatalogEntry,
} from "@/lib/api-suppliers";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ProductBadge = "Servicio" | "Producto";

type SupplierFormEntry = { name: string; priceUYU: string; priceUSD: string; logoUrl?: string; locked?: boolean };

interface ProductFormValues {
  name: string;
  description: string;
  manufacturer: string;
  category: string;
  amount: string;
  currency: CurrencyCode;
  badge: ProductBadge;
  imageUrl: string;
  stock: string;
  manufacturerLogoUrl: string;
  quotedAt: string;
  suppliers: SupplierFormEntry[];
}

const defaultFormValues: ProductFormValues = {
  name: "",
  description: "",
  manufacturer: "",
  category: "",
  amount: "",
  currency: "UYU",
  badge: "Servicio",
  imageUrl: "",
  stock: "0",
  manufacturerLogoUrl: "",
  quotedAt: "",
  suppliers: [],
};

const badgeTypes: ProductBadge[] = ["Servicio", "Producto"];
type CurrencyCode = "UYU" | "USD";
const currencyOptions: { code: CurrencyCode; label: string }[] = [
  { code: "UYU", label: "Pesos uruguayos" },
  { code: "USD", label: "Dólares" },
];

type ProductTableColumn = "name" | "description" | "manufacturer" | "price" | "supplier" | "type" | "stock" | "category";

const productTableColumns: { key: ProductTableColumn; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "description", label: "Descripción" },
  { key: "manufacturer", label: "Fabricante" },
  { key: "price", label: "Precio" },
  { key: "supplier", label: "Proveedor" },
  { key: "type", label: "Tipo" },
  { key: "stock", label: "Stock" },
  { key: "category", label: "Categoría" },
];

const LOAD_INCREMENT = 50;

const formatCurrencyValue = (value: number, currency: "UYU" | "USD") =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const formatDateValue = (value?: string | number | Date) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-UY", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
};

const typeMeta: Record<ProductBadge, { icon: typeof Activity | typeof Package; color: string }> = {
  Servicio: { icon: Activity, color: "text-orange-500" },
  Producto: { icon: Package, color: "text-sky-500" },
};

const badgeDescriptions: Record<ProductBadge, string> = {
  Servicio: "Implementaciones, soporte y consultorías",
  Producto: "Equipamiento físico, dispositivos o kits",
};

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("No se pudo leer la imagen"));
    };
    reader.onerror = () => {
      reject(reader.error || new Error("No se pudo leer la imagen"));
    };
    reader.readAsDataURL(file);
  });

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ProductBadge | "all">("all");
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(defaultFormValues);
  const [saving, setSaving] = useState(false);

  // Manufacturer modal state
  const [manufacturerModalOpen, setManufacturerModalOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<ManufacturerEntry | null>(null);
  const [manufacturerForm, setManufacturerForm] = useState({ name: "", logoUrl: "" });

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryEntry | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "" });

  // Supplier modal state
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierCatalogEntry | null>(null);
  const [supplierForm, setSupplierForm] = useState({ name: "", priceUYU: "", priceUSD: "", logoUrl: "" });
  const [supplierCatalog, setSupplierCatalog] = useState<SupplierCatalogEntry[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  const [manufacturers, setManufacturers] = useState<ManufacturerEntry[]>([]);
  const [categories, setCategories] = useState<CategoryEntry[]>([]);

  const [visibleColumns, setVisibleColumns] = useState<
    Record<ProductTableColumn, boolean>
  >(() =>
    productTableColumns.reduce(
      (acc, column) => ({ ...acc, [column.key]: true }),
      {} as Record<ProductTableColumn, boolean>
    )
  );
  const [visibleCount, setVisibleCount] = useState(LOAD_INCREMENT);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const fetched = await fetchAllProducts();
      setProducts(fetched);
    } catch (error) {
      console.error("No se pudieron cargar los productos", error);
      toast.error("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSupplierCatalog = useCallback(async () => {
    try {
      const entries = await fetchSupplierCatalog();
      setSupplierCatalog(entries);
    } catch (error) {
      console.error("No se pudo cargar el catálogo de proveedores", error);
      toast.error("No se pudo cargar el catálogo de proveedores");
    }
  }, []);

  const loadManufacturers = useCallback(async () => {
    try {
      const entries = await fetchManufacturers();
      setManufacturers(entries);
    } catch (error) {
      console.error("No se pudieron cargar los fabricantes", error);
      toast.error("No se pudieron cargar los fabricantes");
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const entries = await fetchCategories();
      setCategories(entries);
    } catch (error) {
      console.error("No se pudieron cargar las categorías", error);
      toast.error("No se pudieron cargar las categorías");
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadSupplierCatalog();
  }, [loadSupplierCatalog]);

  useEffect(() => {
    loadManufacturers();
  }, [loadManufacturers]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const summaryStats = useMemo(() => {
    const total = products.length;
    const services = products.filter((product) => product.badge === "Servicio").length;
    const physical = products.filter((product) => product.badge === "Producto").length;
    return { total, services, physical };
  }, [products]);

  const manufacturerFilterOptions = useMemo(() => {
    const fromRegistry = manufacturers.map((entry) => entry.name).filter(Boolean);
    const fromProducts = products.map((p) => p.manufacturer).filter(Boolean);
    return Array.from(new Set([...fromRegistry, ...fromProducts])).sort();
  }, [manufacturers, products]);

  const categoryFilterOptions = useMemo(() => {
    const fromRegistry = categories.map((entry) => entry.name).filter(Boolean);
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...fromRegistry, ...fromProducts])).sort();
  }, [categories, products]);

  const uniqueSuppliers = useMemo(() => {
    const supplierNames = supplierCatalog
      .map((supplier) => supplier.name?.trim())
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(supplierNames)).sort((a, b) => a.localeCompare(b));
  }, [supplierCatalog]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro por texto de búsqueda
    const term = searchTerm.toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.manufacturer.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
      );
    }

    // Filtro por tipo
    if (filterType !== "all") {
      filtered = filtered.filter((product) => product.badge === filterType);
    }

    // Filtro por fabricante
    if (filterManufacturer !== "all") {
      filtered = filtered.filter((product) => product.manufacturer === filterManufacturer);
    }

    // Filtro por categoría
    if (filterCategory !== "all") {
      filtered = filtered.filter((product) => product.category === filterCategory);
    }

    if (filterSupplier !== "all") {
      filtered = filtered.filter((product) =>
        (product.suppliers ?? []).some((supplier) => supplier.name?.trim() === filterSupplier)
      );
    }

    return filtered;
  }, [searchTerm, products, filterType, filterManufacturer, filterCategory, filterSupplier]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );
  const hasMoreResults = visibleCount < filteredProducts.length;

  useEffect(() => {
    setVisibleCount(LOAD_INCREMENT);
  }, [
    searchTerm,
    filterType,
    filterManufacturer,
    filterCategory,
    filterSupplier,
    filteredProducts.length,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreResults && !loading) {
          setVisibleCount((prev) => Math.min(prev + LOAD_INCREMENT, filteredProducts.length));
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, hasMoreResults, loading, filteredProducts.length]);
  const visibleColumnCount = productTableColumns.filter((column) => visibleColumns[column.key]).length;

  const resetForm = () => setFormValues(defaultFormValues);

  const openModal = () => {
    resetForm();
    setEditingProduct(null);
    setSelectedSupplierId("");
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const trimmedName = formValues.name.trim();
      const trimmedManufacturer = formValues.manufacturer.trim();
      if (!trimmedName || !trimmedManufacturer) {
        toast.error("Nombre y fabricante son obligatorios.");
        return;
      }
      const amountNumber = Number(formValues.amount) || 0;
      const payload = {
        name: trimmedName,
        description: formValues.description,
        manufacturer: trimmedManufacturer,
        category: formValues.category,
        badge: formValues.badge,
        priceUYU: formValues.currency === "UYU" ? amountNumber : 0,
        priceUSD: formValues.currency === "USD" ? amountNumber : 0,
        imageUrl: formValues.imageUrl || "",
        stock: Number(formValues.stock) || 0,
        manufacturerLogoUrl: formValues.manufacturerLogoUrl || "",
        quotedAt: formValues.quotedAt ? new Date(formValues.quotedAt).toISOString() : undefined,
        suppliers: formValues.suppliers.map(s => ({
          name: s.name,
          priceUYU: Number(s.priceUYU) || 0,
          priceUSD: Number(s.priceUSD) || 0,
        })),
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success("Producto actualizado.");
      } else {
        await createProduct(payload);
        toast.success("Producto creado.");
      }
      setModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error("Error guardando el producto", error);
      toast.error("No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setSelectedSupplierId("");
    setFormValues({
      name: product.name ?? "",
      description: product.description ?? "",
      manufacturer: product.manufacturer ?? "",
      category: product.category ?? "",
      amount: (product.priceUYU || product.priceUSD || 0).toString(),
      currency: product.priceUSD && product.priceUSD > 0 ? "USD" : "UYU",
      badge: product.badge ?? "Servicio",
      imageUrl: product.imageUrl ?? "",
      stock: product.stock?.toString() ?? "0",
      manufacturerLogoUrl: product.manufacturerLogoUrl ?? "",
      quotedAt: product.quotedAt ? product.quotedAt.slice(0, 10) : "",
      suppliers: (product.suppliers || []).map(s => ({
        name: s.name ?? "",
        priceUYU: (s.priceUYU ?? 0).toString(),
        priceUSD: (s.priceUSD ?? 0).toString(),
        locked: true,
      })),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success("Producto eliminado.");
      loadProducts();
    } catch (error) {
      console.error("Error eliminando el producto", error);
      toast.error("No se pudo eliminar el producto.");
    }
  };

  // Manufacturer CRUD handlers
  const openManufacturerModal = (manufacturer?: ManufacturerEntry) => {
    if (manufacturer) {
      setEditingManufacturer(manufacturer);
      const product = products.find(p => p.manufacturer === manufacturer.name);
      setManufacturerForm({
        name: manufacturer.name,
        logoUrl: manufacturer.logoUrl || product?.manufacturerLogoUrl || "",
      });
    } else {
      setEditingManufacturer(null);
      setManufacturerForm({ name: "", logoUrl: "" });
    }
    setManufacturerModalOpen(true);
  };

  const saveManufacturer = async () => {
    const trimmedName = manufacturerForm.name.trim();
    if (!trimmedName) {
      toast.error("El nombre del fabricante es requerido");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: trimmedName,
        logoUrl: manufacturerForm.logoUrl.trim(),
      };
      if (editingManufacturer) {
        await updateManufacturer(editingManufacturer.id, payload);
        toast.success("Fabricante actualizado");
      } else {
        await createManufacturer(payload);
        toast.success("Fabricante creado");
      }
      setManufacturerModalOpen(false);
      setEditingManufacturer(null);
      setManufacturerForm({ name: "", logoUrl: "" });
      loadManufacturers();
      loadProducts();
    } catch (error) {
      console.error("Error guardando fabricante", error);
      toast.error("Error guardando fabricante");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteManufacturer = async (manufacturer: ManufacturerEntry) => {
    try {
      setSaving(true);
      await deleteManufacturerEntry(manufacturer.id);
      toast.success("Fabricante eliminado");
      loadManufacturers();
      loadProducts();
    } catch (error) {
      console.error("Error eliminando fabricante", error);
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el fabricante");
    } finally {
      setSaving(false);
    }
  };

  // Category CRUD handlers
  const openCategoryModal = (category?: CategoryEntry) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "" });
    }
    setCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    const trimmedName = categoryForm.name.trim();
    if (!trimmedName) {
      toast.error("El nombre de la categoría es requerido");
      return;
    }
    try {
      setSaving(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: trimmedName });
        toast.success("Categoría actualizada");
      } else {
        await createCategory({ name: trimmedName });
        toast.success("Categoría creada");
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: "" });
      loadCategories();
      loadProducts();
    } catch (error) {
      console.error("Error guardando categoría", error);
      toast.error("Error guardando categoría");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: CategoryEntry) => {
    try {
      setSaving(true);
      await deleteCategoryEntry(category.id);
      toast.success("Categoría eliminada");
      loadCategories();
      loadProducts();
    } catch (error) {
      console.error("Error eliminando categoría", error);
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la categoría");
    } finally {
      setSaving(false);
    }
  };

  // Supplier CRUD handlers
  const openSupplierModal = (supplier?: SupplierCatalogEntry | { name: string }) => {
    if (supplier) {
      const hasId = "id" in supplier && Boolean(supplier.id);
      setEditingSupplier(hasId ? (supplier as SupplierCatalogEntry) : null);
      setSupplierForm({
        name: supplier.name,
        priceUYU: hasId ? (supplier as SupplierCatalogEntry).priceUYU?.toString() || "" : "",
        priceUSD: hasId ? (supplier as SupplierCatalogEntry).priceUSD?.toString() || "" : "",
        logoUrl: hasId ? (supplier as SupplierCatalogEntry).logoUrl || "" : "",
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({ name: "", priceUYU: "", priceUSD: "", logoUrl: "" });
    }
    setSupplierModalOpen(true);
  };

  const saveSupplier = async () => {
    const trimmedName = supplierForm.name.trim();
    if (!trimmedName) {
      toast.error("El nombre del proveedor es requerido");
      return;
    }
    try {
      const payload = {
        name: trimmedName,
        priceUYU: Number(supplierForm.priceUYU) || 0,
        priceUSD: Number(supplierForm.priceUSD) || 0,
        logoUrl: supplierForm.logoUrl.trim(),
      };
      if (editingSupplier) {
        await updateSupplierCatalogEntry(editingSupplier.id, payload);
        toast.success("Proveedor actualizado");
      } else {
        await createSupplierCatalogEntry(payload);
        toast.success("Proveedor creado");
      }
      setSupplierModalOpen(false);
      setEditingSupplier(null);
      loadSupplierCatalog();
    } catch (error) {
      console.error("Error guardando proveedor", error);
      toast.error("No se pudo guardar el proveedor");
    }
  };

  const deleteSupplier = async (supplier: SupplierCatalogEntry) => {
    const affectedProducts = products.filter(p =>
      p.suppliers && p.suppliers.some(s => s.name === supplier.name)
    );
    if (affectedProducts.length > 0) {
      toast.error(`No se puede eliminar: ${affectedProducts.length} producto(s) asociado(s)`);
      return;
    }
    try {
      await deleteSupplierCatalogEntry(supplier.id);
      toast.success("Proveedor eliminado");
      loadSupplierCatalog();
    } catch (error) {
      console.error("Error eliminando proveedor", error);
      toast.error("No se pudo eliminar el proveedor");
    }
  };

  const addSupplierFromCatalog = () => {
    if (!selectedSupplierId) {
      toast.error("Selecciona un proveedor registrado");
      return;
    }
    const catalogEntry = supplierCatalog.find((s) => s.id === selectedSupplierId);
    if (!catalogEntry) {
      toast.error("Proveedor no encontrado");
      return;
    }
    const already = formValues.suppliers.some((s) => s.name === catalogEntry.name);
    if (already) {
      toast.info("Ese proveedor ya está agregado");
      return;
    }
    const nextSuppliers = [
      ...formValues.suppliers,
      {
        name: catalogEntry.name,
        priceUYU: catalogEntry.priceUYU?.toString() || "",
        priceUSD: catalogEntry.priceUSD?.toString() || "",
        locked: true,
      },
    ];
    setFormValues({ ...formValues, suppliers: nextSuppliers });
    setSelectedSupplierId("");
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setFormValues((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (error) {
      console.error("Error leyendo la imagen del producto", error);
      toast.error("No se pudo leer la imagen.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <ShinyText size="3xl" weight="bold">Productos y servicios</ShinyText>
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra el catálogo con badges, categorías, precios en USD/UYU e imágenes.
            </p>
          </div>
        </div>

        {/* KPI bar eliminada (minimalista en header de tabs) */}

        {/* Header: tabs left, stats right */}
        <Tabs defaultValue="products" className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" />
                Productos
              </TabsTrigger>
              <TabsTrigger value="manufacturers" className="gap-2">
                <Factory className="h-4 w-4" />
                Fabricantes
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <FolderTree className="h-4 w-4" />
                Categorías
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-2">
                <Truck className="h-4 w-4" />
                Proveedores
              </TabsTrigger>
            </TabsList>
            <div className="ml-4 hidden md:flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Activity className="h-3.5 w-3.5 text-slate-500" />
                <span>Total</span>
                <span className="font-semibold text-slate-900">{summaryStats.total}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span>Servicios</span>
                <span className="font-semibold text-slate-900">{summaryStats.services}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>Productos</span>
                <span className="font-semibold text-slate-900">{summaryStats.physical}</span>
              </span>
            </div>
          </div>

          <TabsContent value="products" className="space-y-6 mt-2">

            {/* Removed bulky KPI cards in favor of the inline bar */}

            <FilterToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Buscar productos..."
              className="px-2"
            >
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-slate-100 transition-all gap-2">
                      <Activity className="h-4 w-4" />
                      Tipo
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuCheckboxItem
                      checked={filterType === "all"}
                      onCheckedChange={() => setFilterType("all")}
                    >
                      Todos
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filterType === "Servicio"}
                      onCheckedChange={() => setFilterType("Servicio")}
                    >
                      Servicios
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filterType === "Producto"}
                      onCheckedChange={() => setFilterType("Producto")}
                    >
                      Productos
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-slate-100 transition-all gap-2">
                      <Factory className="h-4 w-4" />
                      Fabricante
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuCheckboxItem
                      checked={filterManufacturer === "all"}
                      onCheckedChange={() => setFilterManufacturer("all")}
                    >
                      Todos
                    </DropdownMenuCheckboxItem>
                    {manufacturerFilterOptions.map((manufacturer) => (
                      <DropdownMenuCheckboxItem
                        key={manufacturer}
                        checked={filterManufacturer === manufacturer}
                        onCheckedChange={() => setFilterManufacturer(manufacturer)}
                      >
                        {manufacturer}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-slate-100 transition-all gap-2">
                      <FolderTree className="h-4 w-4" />
                      Categoría
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuCheckboxItem
                      checked={filterCategory === "all"}
                      onCheckedChange={() => setFilterCategory("all")}
                    >
                      Todas
                    </DropdownMenuCheckboxItem>
                    {categoryFilterOptions.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={filterCategory === category}
                        onCheckedChange={() => setFilterCategory(category)}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="w-px h-6 bg-slate-200/60 mx-1" />

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-slate-100 transition-all gap-2 font-medium">
                      <Tag className="h-4 w-4" />
                      Columnas
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                      Columnas visibles
                    </DropdownMenuLabel>
                    {productTableColumns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        checked={visibleColumns[column.key]}
                        onCheckedChange={(checked) =>
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [column.key]: Boolean(checked),
                          }))
                        }
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={openModal}
                  variant="default"
                  disabled={loading}
                  className="h-10 rounded-xl bg-slate-900 border-none text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Cargando..." : "Nuevo"}
                </Button>
              </div>
            </FilterToolbar>

            <Card className="w-full">
              <CardContent className="space-y-4 overflow-hidden pt-6">

                <div className="w-full">
                  <div className="rounded-2xl border border-slate-100 bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden">
                    <div className="max-h-[75vh] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="hover:bg-transparent">
                            {productTableColumns.map((column) => (
                              visibleColumns[column.key] && (
                                <TableHead key={column.key} className="h-11 text-[10px] font-black uppercase text-slate-400 tracking-widest py-3">
                                  {column.label}
                                </TableHead>
                              )
                            ))}
                            <TableHead className="w-20 text-right py-3 pr-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <AnimatedTableBody>
                          {visibleProducts.length === 0 && !loading ? (
                            <TableRow>
                              <TableCell colSpan={visibleColumnCount + 1} className="h-32 text-center text-slate-400">
                                No se encontraron productos
                              </TableCell>
                            </TableRow>
                          ) : (
                            visibleProducts.map((product, index) => {
                              const meta = typeMeta[product.badge];
                              const TypeIcon = meta.icon;
                              return (
                                <AnimatedRow key={product.id || index} delay={index * 0.02} className="group/row hover:bg-slate-50/50 transition-colors">
                                  {visibleColumns.name && (
                                    <TableCell className="py-3 font-semibold text-slate-900 min-w-[200px]">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100 shadow-sm transition-transform group-hover/row:scale-110">
                                          {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                          ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                              <ImageIcon className="h-5 w-5" />
                                            </div>
                                          )}
                                        </div>
                                        <span className="line-clamp-2">{product.name}</span>
                                      </div>
                                    </TableCell>
                                  )}
                                  {visibleColumns.description && (
                                    <TableCell className="py-3 text-slate-500 text-sm max-w-[250px]">
                                      <span className="line-clamp-2">{product.description || "—"}</span>
                                    </TableCell>
                                  )}
                                  {visibleColumns.manufacturer && (
                                    <TableCell className="py-3 min-w-[140px]">
                                      <div className="flex items-center gap-2">
                                        {product.manufacturerLogoUrl && (
                                          <div className="h-6 w-6 overflow-hidden rounded-full border bg-white flex-shrink-0">
                                            <img src={product.manufacturerLogoUrl} alt={product.manufacturer} className="h-full w-full object-cover" />
                                          </div>
                                        )}
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 font-medium">
                                          {product.manufacturer}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                  )}
                                  {visibleColumns.price && (
                                    <TableCell className="py-3">
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                          {product.priceUSD && product.priceUSD > 0 ? (
                                            <>
                                              <ReactCountryFlag svg countryCode="US" className="h-3 w-4" />
                                              <span>{formatCurrencyValue(product.priceUSD, "USD")}</span>
                                            </>
                                          ) : (
                                            <>
                                              <ReactCountryFlag svg countryCode="UY" className="h-3 w-4" />
                                              <span>{formatCurrencyValue(product.priceUYU || 0, "UYU")}</span>
                                            </>
                                          )}
                                        </div>
                                        {product.quotedAt && (
                                          <span className="text-[10px] text-slate-400 font-medium">Cotiz: {formatDateValue(product.quotedAt)}</span>
                                        )}
                                      </div>
                                    </TableCell>
                                  )}
                                  {visibleColumns.supplier && (
                                    <TableCell className="py-3">
                                      {product.suppliers && product.suppliers.length > 0 ? (
                                        <div className="flex -space-x-2">
                                          {product.suppliers.slice(0, 3).map((s, i) => (
                                            <Tooltip key={i}>
                                              <TooltipTrigger asChild>
                                                <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm cursor-help">
                                                  {s.name?.charAt(0)}
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="bg-slate-900 text-white border-none shadow-xl">
                                                <div className="flex flex-col gap-1 p-1">
                                                  <span className="font-bold">{s.name}</span>
                                                  <div className="flex items-center gap-2 text-[10px] opacity-80">
                                                    <span>{s.priceUSD ? formatCurrencyValue(s.priceUSD, "USD") : formatCurrencyValue(s.priceUYU || 0, "UYU")}</span>
                                                  </div>
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          ))}
                                          {product.suppliers.length > 3 && (
                                            <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">
                                              +{product.suppliers.length - 3}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-300">—</span>
                                      )}
                                    </TableCell>
                                  )}
                                  {visibleColumns.type && (
                                    <TableCell className="py-3">
                                      <Badge
                                        className={cn(
                                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                                          product.badge === "Servicio" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-sky-50 text-sky-600 border-sky-100"
                                        )}
                                        variant="outline"
                                      >
                                        {product.badge}
                                      </Badge>
                                    </TableCell>
                                  )}
                                  {visibleColumns.stock && (
                                    <TableCell className="py-3">
                                      <div className="flex items-center gap-1.5">
                                        <div className={cn("h-1.5 w-1.5 rounded-full shadow-sm", (product.stock || 0) > 0 ? "bg-emerald-500" : "bg-rose-500")} />
                                        <span className={cn("font-bold text-sm", (product.stock || 0) > 0 ? "text-slate-700" : "text-rose-600")}>
                                          {product.stock || 0}
                                        </span>
                                      </div>
                                    </TableCell>
                                  )}
                                  {visibleColumns.category && (
                                    <TableCell className="py-3">
                                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{product.category || "General"}</span>
                                    </TableCell>
                                  )}
                                  <TableCell className="text-right py-3 pr-6">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900">
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </AnimatedRow>
                              );
                            })
                          )}
                        </AnimatedTableBody>
                      </Table>
                      {hasMoreResults && (
                        <div ref={observerTarget} className="px-4 py-8 text-center border-t border-slate-50">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-200" />
                          <p className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] mt-2">Cargando más productos</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="manufacturers" className="space-y-6 mt-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-slate-600" />
                    <CardTitle className="text-base">Fabricantes registrados</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openManufacturerModal()}>
                    <Plus className="h-4 w-4" />
                    Nuevo fabricante
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Logo</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Productos</TableHead>
                        <TableHead className="w-24 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <AnimatedTableBody staggerDelay={0.03}>
                      {manufacturers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No hay fabricantes registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        manufacturers.map((manufacturer, index) => {
                          const manufacturerProducts = products.filter(p => p.manufacturer === manufacturer.name);
                          const logoUrl = manufacturer.logoUrl || manufacturerProducts.find(p => p.manufacturerLogoUrl)?.manufacturerLogoUrl;
                          return (
                            <AnimatedRow key={manufacturer.id} delay={index * 0.03}>
                              <TableCell>
                                {logoUrl ? (
                                  <div className="h-10 w-10 rounded-full border bg-white/80 overflow-hidden">
                                    <img src={logoUrl} alt={manufacturer.name} className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded-full border bg-slate-100 flex items-center justify-center">
                                    <Factory className="h-5 w-5 text-slate-400" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{manufacturer.name}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{manufacturerProducts.length}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openManufacturerModal(manufacturer)}>
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeleteManufacturer(manufacturer)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </AnimatedRow>
                          );
                        })
                      )}
                    </AnimatedTableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6 mt-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-slate-600" />
                    <CardTitle className="text-base">Categorías registradas</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openCategoryModal()}>
                    <Plus className="h-4 w-4" />
                    Nueva categoría
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Productos</TableHead>
                        <TableHead className="w-24 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No hay categorías registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((category) => {
                          const categoryProducts = products.filter(p => p.category === category.name);
                          return (
                            <TableRow key={category.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                    <FolderTree className="h-4 w-4 text-slate-600" />
                                  </div>
                                  <span className="font-medium">{category.name || "Sin categoría"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{categoryProducts.length}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openCategoryModal(category)}>
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeleteCategory(category)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6 mt-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-slate-600" />
                    <CardTitle className="text-base">Proveedores registrados</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openSupplierModal()}>
                    <Plus className="h-4 w-4" />
                    Nuevo proveedor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Productos asociados</TableHead>
                        <TableHead className="text-right">Rango de precios</TableHead>
                        <TableHead className="w-24 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const suppliersMap = new Map<
                          string,
                          {
                            products: number;
                            minPrice?: number;
                            maxPrice?: number;
                            currency?: "USD" | "UYU";
                            catalogEntry?: SupplierCatalogEntry;
                          }
                        >();

                        products.forEach((product) => {
                          product.suppliers?.forEach((supplier) => {
                            const name = supplier.name?.trim();
                            if (!name) return;
                            const priceUsd = Number(supplier.priceUSD) || 0;
                            const priceUyu = Number(supplier.priceUYU) || 0;
                            const price = priceUsd > 0 ? priceUsd : priceUyu;
                            const currency = priceUsd > 0 ? "USD" : price > 0 ? "UYU" : undefined;
                            const existing = suppliersMap.get(name) ?? { products: 0 };
                            existing.products += 1;
                            if (price && (existing.minPrice === undefined || price < existing.minPrice)) {
                              existing.minPrice = price;
                              existing.currency = currency;
                            }
                            if (price && (existing.maxPrice === undefined || price > existing.maxPrice)) {
                              existing.maxPrice = price;
                              existing.currency = currency;
                            }
                            suppliersMap.set(name, existing);
                          });
                        });

                        supplierCatalog.forEach((catalogEntry) => {
                          const name = catalogEntry.name?.trim();
                          if (!name) return;
                          const existing = suppliersMap.get(name) ?? { products: 0 };
                          existing.catalogEntry = catalogEntry;
                          const catalogPrice = catalogEntry.priceUSD > 0 ? catalogEntry.priceUSD : catalogEntry.priceUYU;
                          const catalogCurrency = catalogEntry.priceUSD > 0 ? "USD" : catalogEntry.priceUYU > 0 ? "UYU" : existing.currency;
                          if (catalogPrice) {
                            if (existing.minPrice === undefined || catalogPrice < existing.minPrice) {
                              existing.minPrice = catalogPrice;
                              existing.currency = catalogCurrency;
                            }
                            if (existing.maxPrice === undefined || catalogPrice > existing.maxPrice) {
                              existing.maxPrice = catalogPrice;
                              existing.currency = catalogCurrency;
                            }
                          }
                          suppliersMap.set(name, existing);
                        });

                        const supplierNames = Array.from(suppliersMap.keys()).sort((a, b) => a.localeCompare(b));

                        if (supplierNames.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No hay proveedores registrados
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return supplierNames.map((name) => {
                          const data = suppliersMap.get(name)!;
                          const showRange = data.minPrice !== undefined && data.maxPrice !== undefined && data.currency;
                          const catalogEntry = data.catalogEntry;
                          return (
                            <TableRow key={name}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 overflow-hidden rounded-lg border bg-white/80 flex items-center justify-center">
                                    {catalogEntry?.logoUrl ? (
                                      <img src={catalogEntry.logoUrl} alt={name} className="h-full w-full object-cover" />
                                    ) : (
                                      <Truck className="h-4 w-4 text-blue-600" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{name}</span>
                                    {!catalogEntry && (
                                      <span className="text-[11px] text-muted-foreground">Solo asociado desde productos</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{data.products}</Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {showRange ? (
                                  data.minPrice === data.maxPrice ? (
                                    <span className="font-semibold">
                                      {new Intl.NumberFormat("es-UY", { style: "currency", currency: data.currency as string }).format(data.minPrice || 0)}
                                    </span>
                                  ) : (
                                    <span className="font-semibold">
                                      {new Intl.NumberFormat("es-UY", { style: "currency", currency: data.currency as string }).format(data.minPrice || 0)}
                                      {" - "}
                                      {new Intl.NumberFormat("es-UY", { style: "currency", currency: data.currency as string }).format(data.maxPrice || 0)}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-muted-foreground">Sin precio</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => openSupplierModal(catalogEntry || { name })}
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                    disabled={!catalogEntry}
                                    onClick={() => catalogEntry && deleteSupplier(catalogEntry)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="w-full sm:max-w-3xl lg:max-w-4xl rounded-2xl border border-slate-100 shadow-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="h-5 w-5 text-slate-600" />
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {editingProduct ? "Editar producto" : "Nuevo producto o servicio"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-3">
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo principal</p>
                    <p className="text-base font-semibold text-slate-900">¿Es un servicio o un producto?</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Define badges y métricas agrupadas</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {badgeTypes.map((type) => {
                    const Icon = typeMeta[type].icon;
                    const active = formValues.badge === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormValues({ ...formValues, badge: type })}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition",
                          active
                            ? "border-orange-400 bg-orange-50/80 shadow-sm"
                            : "border-transparent bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full bg-white",
                              active ? "text-orange-500" : "text-slate-500"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{type}</p>
                            <p className="text-xs text-muted-foreground">{badgeDescriptions[type]}</p>
                          </div>
                        </div>
                        <span className={cn("text-xs font-semibold", active ? "text-orange-600" : "text-slate-400")}>
                          {active ? "Seleccionado" : "Elegir"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general" className="gap-2">
                    <Package className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="precio" className="gap-2">
                    <Coins className="h-4 w-4" />
                    Precio
                  </TabsTrigger>
                  <TabsTrigger value="proveedores" className="gap-2">
                    <Truck className="h-4 w-4" />
                    Proveedores
                  </TabsTrigger>
                  <TabsTrigger value="media" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-4 space-y-4">
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Detalles</p>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-slate-700">
                        <Package className="h-4 w-4 text-slate-500" />
                        Nombre
                      </Label>
                      <Input
                        value={formValues.name}
                        onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                        required
                        placeholder="Ej: Licencia anual"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-slate-700">
                        <Star className="h-4 w-4 text-slate-500" />
                        Descripción
                      </Label>
                      <Input
                        value={formValues.description}
                        onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                        placeholder="Detalle breve del producto"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-700">
                          <Tag className="h-4 w-4 text-slate-500" />
                          Fabricante
                        </Label>
                        <Input
                          list="manufacturers-list"
                          value={formValues.manufacturer}
                          onChange={(e) => setFormValues({ ...formValues, manufacturer: e.target.value })}
                          placeholder="Selecciona o escribe"
                          required
                        />
                        <datalist id="manufacturers-list">
                          {manufacturerFilterOptions.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-700">
                          <Layers className="h-4 w-4 text-slate-500" />
                          Categoría
                        </Label>
                        <Input
                          list="categories-list"
                          value={formValues.category}
                          onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
                          placeholder="Ej: Monitoreo"
                        />
                        <datalist id="categories-list">
                          {categoryFilterOptions.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="precio" className="mt-4 space-y-4">
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Precio y stock</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-slate-700">
                          <Coins className="h-4 w-4 text-slate-500" />
                          Moneda
                        </Label>
                        <div className="flex items-center gap-2">
                          <select
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
                            value={formValues.currency}
                            onChange={(e) => setFormValues({ ...formValues, currency: e.target.value as CurrencyCode })}
                            aria-label="Moneda"
                          >
                            {currencyOptions.map((opt) => (
                              <option key={opt.code} value={opt.code}>{opt.label}</option>
                            ))}
                          </select>
                          {formValues.currency === "UYU" ? (
                            <ReactCountryFlag svg countryCode="UY" className="h-4 w-4" />
                          ) : (
                            <ReactCountryFlag svg countryCode="US" className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="flex items-center gap-2 text-slate-700">
                          <Banknote className="h-4 w-4 text-slate-500" />
                          Monto
                        </Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={formValues.amount}
                          onChange={(e) => setFormValues({ ...formValues, amount: e.target.value })}
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-slate-700">
                          <Activity className="h-4 w-4 text-slate-500" />
                          Stock
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={formValues.stock}
                          onChange={(e) => setFormValues({ ...formValues, stock: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-slate-700">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          Fecha de cotización
                        </Label>
                        <Input
                          type="date"
                          value={formValues.quotedAt}
                          onChange={(e) => setFormValues({ ...formValues, quotedAt: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="proveedores" className="mt-4 space-y-4">
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-slate-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">Proveedores</span>
                          <span className="text-xs text-muted-foreground">Selecciona existentes desde el catálogo</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2">
                          <select
                            className="w-56 rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
                            value={selectedSupplierId}
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                            aria-label="Seleccionar proveedor"
                          >
                            <option value="">Seleccionar proveedor</option>
                            {supplierCatalog.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <Button type="button" variant="secondary" size="sm" onClick={addSupplierFromCatalog} disabled={!selectedSupplierId}>
                            Añadir
                          </Button>
                        </div>
                      </div>
                    </div>
                    {formValues.suppliers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin proveedores asignados</p>
                    ) : (
                      <div className="space-y-2">
                        {formValues.suppliers.map((supplier, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-white">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <Input
                                placeholder="Nombre proveedor"
                                value={supplier.name ?? ""}
                                readOnly={supplier.locked}
                                onChange={(e) => {
                                  if (supplier.locked) return;
                                  const updated = [...formValues.suppliers];
                                  updated[index].name = e.target.value;
                                  setFormValues({ ...formValues, suppliers: updated });
                                }}
                                className="text-sm"
                              />
                              <Input
                                type="number"
                                placeholder="Precio UYU"
                                value={supplier.priceUYU ?? ""}
                                onChange={(e) => {
                                  const updated = [...formValues.suppliers];
                                  updated[index].priceUYU = e.target.value;
                                  setFormValues({ ...formValues, suppliers: updated });
                                }}
                                className="text-sm"
                              />
                              <Input
                                type="number"
                                placeholder="Precio USD"
                                value={supplier.priceUSD ?? ""}
                                onChange={(e) => {
                                  const updated = [...formValues.suppliers];
                                  updated[index].priceUSD = e.target.value;
                                  setFormValues({ ...formValues, suppliers: updated });
                                }}
                                className="text-sm"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = formValues.suppliers.filter((_, i) => i !== index);
                                setFormValues({ ...formValues, suppliers: updated });
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="media" className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Branding</p>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-700">
                          <ImageIcon className="h-4 w-4 text-slate-500" />
                          Logo del fabricante (URL)
                        </Label>
                        <Input
                          type="url"
                          value={formValues.manufacturerLogoUrl}
                          onChange={(e) =>
                            setFormValues({ ...formValues, manufacturerLogoUrl: e.target.value })
                          }
                          placeholder="https://..."
                        />
                        {formValues.manufacturerLogoUrl && (
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border bg-white/80">
                              <img
                                src={formValues.manufacturerLogoUrl}
                                alt="Logo fabricante"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Mini avatar mostrado en la tabla.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Imagen</p>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-slate-700">
                          <ImageIcon className="h-4 w-4 text-slate-500" />
                          Imagen del artículo
                        </Label>
                        <Input type="file" accept="image/*" onChange={handleImageUpload} />
                        {formValues.imageUrl && (
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-16 w-16 overflow-hidden rounded-lg border bg-slate-50">
                              <img src={formValues.imageUrl} alt="Vista previa" className="h-full w-full object-cover" />
                            </div>
                            <p className="text-xs text-muted-foreground">Miniatura visible en la tabla central.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Agregar producto"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Manufacturer Modal */}
        <Dialog open={manufacturerModalOpen} onOpenChange={setManufacturerModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border border-slate-100 shadow-2xl">
            <DialogHeader className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Factory className="h-5 w-5 text-slate-600" />
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {editingManufacturer ? "Editar fabricante" : "Nuevo fabricante"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700">
                  <Tag className="h-4 w-4 text-slate-500" />
                  Nombre del fabricante
                </Label>
                <Input
                  value={manufacturerForm.name}
                  onChange={(e) => setManufacturerForm({ ...manufacturerForm, name: e.target.value })}
                  placeholder="Ej: Hikvision"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700">
                  <ImageIcon className="h-4 w-4 text-slate-500" />
                  Logo URL
                </Label>
                <Input
                  type="url"
                  value={manufacturerForm.logoUrl}
                  onChange={(e) => setManufacturerForm({ ...manufacturerForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                />
                {manufacturerForm.logoUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border bg-white/80">
                      <img src={manufacturerForm.logoUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                    <p className="text-xs text-muted-foreground">Vista previa del logo</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="justify-end">
              <Button onClick={saveManufacturer} disabled={saving}>
                {saving ? "Guardando..." : editingManufacturer ? "Guardar cambios" : "Crear fabricante"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Modal */}
        <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border border-slate-100 shadow-2xl">
            <DialogHeader className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FolderTree className="h-5 w-5 text-slate-600" />
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {editingCategory ? "Editar categoría" : "Nueva categoría"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700">
                  <Tag className="h-4 w-4 text-slate-500" />
                  Nombre de la categoría
                </Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                  placeholder="Ej: Cámaras IP"
                  required
                />
              </div>
            </div>
            <DialogFooter className="justify-end">
              <Button onClick={saveCategory} disabled={saving}>
                {saving ? "Guardando..." : editingCategory ? "Guardar cambios" : "Crear categoría"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Supplier Modal */}
        <Dialog open={supplierModalOpen} onOpenChange={setSupplierModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border border-slate-100 shadow-2xl">
            <DialogHeader className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Truck className="h-5 w-5 text-slate-600" />
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700">
                  <Tag className="h-4 w-4 text-slate-500" />
                  Nombre del proveedor
                </Label>
                <Input
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="Ej: Proveedor ABC"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 text-sm">
                    <Coins className="h-4 w-4 text-slate-500" />
                    Precio base UYU
                  </Label>
                  <Input
                    type="number"
                    value={supplierForm.priceUYU}
                    onChange={(e) => setSupplierForm({ ...supplierForm, priceUYU: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700 text-sm">
                    <Coins className="h-4 w-4 text-slate-500" />
                    Precio base USD
                  </Label>
                  <Input
                    type="number"
                    value={supplierForm.priceUSD}
                    onChange={(e) => setSupplierForm({ ...supplierForm, priceUSD: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-700">
                  <ImageIcon className="h-4 w-4 text-slate-500" />
                  Logo del proveedor
                </Label>
                <Input
                  type="url"
                  value={supplierForm.logoUrl}
                  onChange={(e) => setSupplierForm({ ...supplierForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                />
                {supplierForm.logoUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border bg-white/80">
                      <img
                        src={supplierForm.logoUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Vista previa del logo</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Estos precios son opcionales y sirven como referencia base para este proveedor
              </p>
            </div>
            <DialogFooter className="justify-end">
              <Button onClick={saveSupplier} disabled={saving}>
                {saving ? "Guardando..." : editingSupplier ? "Guardar cambios" : "Crear proveedor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
