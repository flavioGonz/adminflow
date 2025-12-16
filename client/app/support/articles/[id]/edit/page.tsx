'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import WYSIWYGEditor from '@/components/wysiwyg-editor';
import { apiFetch } from '@/lib/http';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'faq', label: 'Preguntas Frecuentes' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'troubleshooting', label: 'Solución de Problemas' },
  { value: 'api', label: 'API' },
];

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: string;
  published: boolean;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Article>({
    id: '',
    title: '',
    slug: '',
    excerpt: '',
    category: 'general',
    content: '',
    published: false,
  });

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/support/articles/${articleId}`);
      const data = await response.json();

      if (response.ok && data.article) {
        setFormData(data.article);
      } else {
        alert('Error al cargar el artículo');
        router.push('/support/articles');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar el artículo');
      router.push('/support/articles');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug from title
      if (field === 'title') {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      return updated;
    });
  };

  const handleContentChange = (html: string, markdown: string) => {
    handleInputChange('content', html);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }

    if (!formData.excerpt.trim()) {
      alert('El resumen es requerido');
      return;
    }

    if (!formData.content.trim()) {
      alert('El contenido es requerido');
      return;
    }

    try {
      setSaving(true);
      const response = await apiFetch(`/api/support/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/support/articles');
      } else {
        alert(data.error || 'Error al actualizar el artículo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el artículo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Cargando artículo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/support/articles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Editar Artículo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Modifica el contenido del artículo
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Completa los detalles principales del artículo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ej: Cómo crear un nuevo cliente"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="se-genera-automáticamente"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="bg-slate-50 text-slate-600"
              />
              <p className="mt-1 text-xs text-slate-500">
                Se genera automáticamente desde el título
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt">Resumen *</Label>
              <Textarea
                id="excerpt"
                placeholder="Descripción breve del artículo (para listados)"
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Checkbox
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => handleInputChange('published', checked)}
                />
                <Label htmlFor="published" className="font-normal cursor-pointer">
                  Publicado
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenido *</CardTitle>
            <CardDescription>
              Escribe el contenido del artículo usando el editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WYSIWYGEditor
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Escribe el contenido aquí..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/support/articles">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
