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
};

const badgeTypes: ProductBadge[] = ["Servicio", "Producto"];

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
              <Button onClick={openModal} variant="outline" disabled={loading}>
                <Layers className="h-4 w-4" />
                Agregar item
              </Button>
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Precios</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
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
                        <Badge className="mr-2 px-2">{product.badge}</Badge>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>${product.priceUYU} UYU</span>
                          <span>${product.priceUSD} USD</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                        No hay productos que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  )}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
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
                onChange={(e) => setFormValues({ ...formValues, manufacturer: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
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
