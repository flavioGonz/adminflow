"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Activity, ImageIcon, Layers, Search, Star, Tag, Edit3, Trash2, Package } from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactCountryFlag from "react-country-flag";

type ProductBadge = "Servicio" | "Producto";

interface ProductFormValues {
  name: string;
  description: string;
  manufacturer: string;
  category: string;
  priceUYU: string;
  priceUSD: string;
  badge: ProductBadge;
  imageUrl: string;
  stock: string;
  manufacturerLogoUrl: string;
}

const defaultFormValues: ProductFormValues = {
  name: "",
  description: "",
  manufacturer: "",
  category: "",
  priceUYU: "",
  priceUSD: "",
  badge: "Servicio",
  imageUrl: "",
  stock: "0",
  manufacturerLogoUrl: "",
};

const badgeTypes: ProductBadge[] = ["Servicio", "Producto"];

type ProductTableColumn = "name" | "manufacturer" | "price" | "type" | "stock" | "category";

const productTableColumns: { key: ProductTableColumn; label: string }[] = [
  { key: "name", label: "Nombre" },
  { key: "manufacturer", label: "Fabricante" },
  { key: "price", label: "Precio" },
  { key: "type", label: "Tipo" },
  { key: "stock", label: "Stock" },
  { key: "category", label: "Categoría" },
];

const ITEMS_PER_PAGE = 10;

const formatCurrencyValue = (value: number, currency: "UYU" | "USD") =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const typeMeta: Record<ProductBadge, { icon: typeof Activity | typeof Package; color: string }> = {
  Servicio: { icon: Activity, color: "text-orange-500" },
  Producto: { icon: Package, color: "text-sky-500" },
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(defaultFormValues);
  const [saving, setSaving] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<
    Record<ProductTableColumn, boolean>
  >(() =>
    productTableColumns.reduce(
      (acc, column) => ({ ...acc, [column.key]: true }),
      {} as Record<ProductTableColumn, boolean>
    )
  );
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const summaryStats = useMemo(() => {
    const total = products.length;
    const services = products.filter((product) => product.badge === "Servicio").length;
    const physical = products.filter((product) => product.badge === "Producto").length;
    return { total, services, physical };
  }, [products]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      const category = product.category || "Sin categoría";
      map.set(category, (map.get(category) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.manufacturer.toLowerCase().includes(term)
    );
  }, [searchTerm, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = useMemo(
    () =>
      filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [filteredProducts, startIndex]
  );
  const showingFrom = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(filteredProducts.length, startIndex + ITEMS_PER_PAGE);
  const visibleColumnCount = productTableColumns.filter((column) => visibleColumns[column.key]).length;

  const resetForm = () => setFormValues(defaultFormValues);

  const openModal = () => {
    resetForm();
    setEditingProduct(null);
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
      const payload = {
        name: trimmedName,
        description: formValues.description,
        manufacturer: trimmedManufacturer,
        category: formValues.category,
        badge: formValues.badge,
        priceUYU: Number(formValues.priceUYU) || 0,
        priceUSD: Number(formValues.priceUSD) || 0,
        imageUrl: formValues.imageUrl || "",
        stock: Number(formValues.stock) || 0,
        manufacturerLogoUrl: formValues.manufacturerLogoUrl || "",
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
    setFormValues({
      name: product.name,
      description: product.description,
      manufacturer: product.manufacturer,
      category: product.category,
      priceUYU: product.priceUYU.toString(),
      priceUSD: product.priceUSD.toString(),
      badge: product.badge,
      imageUrl: product.imageUrl || "",
      stock: product.stock?.toString() ?? "0",
      manufacturerLogoUrl: product.manufacturerLogoUrl ?? "",
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-slate-900 text-white">
            <CardHeader className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle className="text-sm font-semibold">Total de ítems</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summaryStats.total}</p>
              <p className="text-xs text-white/70">Servicios y productos</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardHeader className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-sm font-semibold">Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summaryStats.services}</p>
              <p className="text-xs text-muted-foreground">En catálogo</p>
            </CardContent>
          </Card>
          <Card className="bg-sky-50">
            <CardHeader className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-sky-500" />
              <CardTitle className="text-sm font-semibold">Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summaryStats.physical}</p>
              <p className="text-xs text-muted-foreground">Tangibles</p>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Catálogo de productos</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
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
                <Button onClick={openModal} variant="outline" disabled={loading}>
                  <Layers className="h-4 w-4" />
                  Agregar item
                </Button>
              </div>
            </div>
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Categoría de productos</span>
              {categories.map(([category, count]) => (
                <Badge key={category} className="px-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {category} ({count})
                  </span>
                </Badge>
              ))}
            </div>
            <ScrollArea className="max-h-[520px] w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    {visibleColumns.name && <TableHead>Nombre</TableHead>}
                    {visibleColumns.manufacturer && <TableHead>Fabricante</TableHead>}
                    {visibleColumns.price && <TableHead>Precio</TableHead>}
                    {visibleColumns.type && <TableHead>Tipo</TableHead>}
                    {visibleColumns.stock && <TableHead>Stock</TableHead>}
                    {visibleColumns.category && <TableHead>Categoría</TableHead>}
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => {
                    const meta = typeMeta[product.badge];
                    const TypeIcon = meta.icon;
                    return (
                      <TableRow key={product.id}>
                        {visibleColumns.name && (
                          <TableCell className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-lg border bg-neutral-50">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
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
                        )}
                        {visibleColumns.manufacturer && (
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border bg-white/90">
                                {product.manufacturerLogoUrl ? (
                                  <img
                                    src={product.manufacturerLogoUrl}
                                    alt={`${product.manufacturer} logo`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-muted-foreground">
                                    {product.manufacturer?.[0] ?? "?"}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold">{product.manufacturer}</span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.price && (
                          <TableCell>
                            {product.priceUYU === 0 && product.priceUSD === 0 ? (
                              <span className="text-xs text-muted-foreground">Sin precio</span>
                            ) : (
                              <div className="flex flex-col gap-1 text-sm text-slate-700">
                                {product.priceUYU > 0 && (
                                  <div className="flex items-center gap-2">
                                    <ReactCountryFlag
                                      svg
                                      countryCode="UY"
                                      className="inline-block h-4 w-5"
                                      aria-label="Uruguay"
                                    />
                                    <span>{formatCurrencyValue(product.priceUYU, "UYU")}</span>
                                  </div>
                                )}
                                {product.priceUSD > 0 && (
                                  <div className="flex items-center gap-2">
                                    <ReactCountryFlag
                                      svg
                                      countryCode="US"
                                      className="inline-block h-4 w-5"
                                      aria-label="Estados Unidos"
                                    />
                                    <span>{formatCurrencyValue(product.priceUSD, "USD")}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.type && (
                          <TableCell>
                            <Badge className="flex items-center gap-1 px-3">
                              <TypeIcon className={`h-4 w-4 ${meta.color}`} />
                              {product.badge}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.stock && (
                          <TableCell>
                            <span className="text-sm font-semibold">
                              {typeof product.stock === "number" ? product.stock : 0}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.category && (
                          <TableCell>
                            <Badge className="bg-slate-100 px-3 text-xs">
                              {product.category || "Sin categoría"}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!loading && filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumnCount + 1}
                        className="text-center text-xs text-muted-foreground"
                      >
                        No hay productos que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  )}
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumnCount + 1}
                        className="text-center text-xs text-muted-foreground"
                      >
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex flex-col gap-2 border-t border-slate-200/60 pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {filteredProducts.length === 0
                  ? "Sin resultados"
                  : `Mostrando ${showingFrom}-${showingTo} de ${filteredProducts.length} productos.`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 text-slate-700"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-slate-600" />
            <DialogTitle>{editingProduct ? "Editar producto" : "Nuevo producto o servicio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={formValues.description}
                onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fabricante</Label>
              <Input
                value={formValues.manufacturer}
                onChange={(e) =>
                  setFormValues({ ...formValues, manufacturer: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Logo del fabricante (URL)</Label>
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
                  <p className="text-xs text-muted-foreground">
                    Mini avatar mostrado en la tabla.
                  </p>
                </div>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Label>Precio UYU</Label>
                <Input
                  type="number"
                  value={formValues.priceUYU}
                  onChange={(e) => setFormValues({ ...formValues, priceUYU: e.target.value })}
                />
              </div>
              <div>
                <Label>Precio USD</Label>
                <Input
                  type="number"
                  value={formValues.priceUSD}
                  onChange={(e) => setFormValues({ ...formValues, priceUSD: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={formValues.stock}
                  onChange={(e) => setFormValues({ ...formValues, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input
                value={formValues.category}
                onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagen del artículo</Label>
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
            <div className="flex gap-2 text-xs">
              {badgeTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={formValues.badge === type ? "default" : "outline"}
                  onClick={() => setFormValues({ ...formValues, badge: type })}
                  className="flex-1 rounded-full"
                >
                  {type}
                </Button>
              ))}
            </div>
            <DialogFooter className="justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Agregar producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
