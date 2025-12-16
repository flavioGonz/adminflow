const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { db } = require('../../db');
const { ObjectId } = require('mongodb');

// Reuse JWT secret fallback from main server
const SECRET_KEY = process.env.JWT_SECRET || 'dev_super_secret';

// Minimal auth middleware (mirrors server/index.js)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

/**
 * GET /api/support/articles
 * Obtiene todos los artículos de ayuda con opción de filtrado
 */
router.get('/articles', async (req, res) => {
  try {
    const { category, published, search } = req.query;
    
    const filter = {};
    
    if (category) filter.category = category;
    if (published !== undefined) filter.published = published === 'true';
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const articles = await db.collection('support_articles')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      articles: articles.map(article => ({
        ...article,
        id: article._id.toString()
      }))
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener artículos'
    });
  }
});

/**
 * GET /api/support/articles/:id
 * Obtiene un artículo específico
 */
router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const article = await db.collection('support_articles')
      .findOne({ _id: new ObjectId(id) });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Artículo no encontrado'
      });
    }

    // Incrementar vistas
    await db.collection('support_articles').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    );

    res.json({
      success: true,
      article: {
        ...article,
        id: article._id.toString(),
        views: article.views + 1
      }
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener artículo'
    });
  }
});

/**
 * POST /api/support/articles
 * Crea un nuevo artículo
 */
router.post('/articles', authenticateToken, async (req, res) => {
  try {
    const { title, slug, excerpt, category, content, published } = req.body;

    if (!title || !excerpt || !content) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: title, excerpt, content'
      });
    }

    // Generar slug si no existe
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Verificar que el slug sea único
    const existingArticle = await db.collection('support_articles')
      .findOne({ slug: finalSlug });

    if (existingArticle) {
      return res.status(400).json({
        success: false,
        error: 'El slug ya existe'
      });
    }

    const newArticle = {
      title,
      slug: finalSlug,
      excerpt,
      category: category || 'general',
      content,
      published: published || false,
      views: 0,
      author: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('support_articles').insertOne(newArticle);

    res.status(201).json({
      success: true,
      article: {
        ...newArticle,
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear artículo'
    });
  }
});

/**
 * PATCH /api/support/articles/:id
 * Actualiza un artículo
 */
router.patch('/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, category, content, published } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const article = await db.collection('support_articles')
      .findOne({ _id: new ObjectId(id) });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Artículo no encontrado'
      });
    }

    const updateData = {};

    if (title) updateData.title = title;
    if (excerpt) updateData.excerpt = excerpt;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (published !== undefined) updateData.published = published;

    // Actualizar slug si cambió el título
    if (title && slug === undefined) {
      updateData.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else if (slug) {
      updateData.slug = slug;
    }

    updateData.updatedAt = new Date();

    const result = await db.collection('support_articles')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: 'Artículo no encontrado'
      });
    }

    res.json({
      success: true,
      article: {
        ...result.value,
        id: result.value._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar artículo'
    });
  }
});

/**
 * DELETE /api/support/articles/:id
 * Elimina un artículo
 */
router.delete('/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const result = await db.collection('support_articles')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Artículo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Artículo eliminado'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar artículo'
    });
  }
});

module.exports = router;
