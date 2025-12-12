# 🚀 AdminFlow

<div align="center">

![AdminFlow Logo](client/public/logo.png)

**Sistema de Gestión Empresarial Completo**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-green?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.6-green?logo=mongodb)](https://www.mongodb.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)](https://www.sqlite.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 🎯 Descripción General

**AdminFlow** es una plataforma integral de gestión empresarial que combina un frontend moderno construido con **Next.js** (React) y un backend robusto en **Express.js**. Está diseñado para centralizar la gestión de clientes, tickets de soporte, contratos, presupuestos y pagos.

La plataforma cuenta con una arquitectura de base de datos híbrida, utilizando **SQLite** para operaciones locales rápidas y **MongoDB** para funcionalidades avanzadas, escalabilidad y persistencia de datos de la aplicación.

## 📚 Documentación Completa

### 🚀 Guías de Deployment (Nuevo)

Para instalación y deployment remotos, consulta:

| Documento                                   | Descripción                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| ⭐ **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | Resumen rápido (2 minutos) - **COMIENZA AQUÍ** |
| 📊 **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** | Resumen ejecutivo de cambios y estado del deployment |
| 📋 **[GIT_COMPARISON_REPORT.md](./GIT_COMPARISON_REPORT.md)** | Análisis detallado de cambios locales vs GitHub |
| 🚀 **[REMOTE_INSTALLATION.md](./REMOTE_INSTALLATION.md)** | Guía paso-a-paso para instalación remota |
| 🔧 **[INSTALL_IMPROVEMENTS.md](./INSTALL_IMPROVEMENTS.md)** | Documentación técnica de las 7 mejoras de instalación |

### 📖 Documentación del Proyecto

Toda la documentación detallada del proyecto se encuentra en la carpeta [`/docs`](./docs/).

| Documento                                   | Descripción                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| 📄 **[README General](./docs/README_GENERAL.md)** | Una introducción de alto nivel al propósito del proyecto y su stack tecnológico.   |
| 🛠️ **[Guía de Instalación](./docs/INSTALL_GUIDE.md)** | Pasos detallados para clonar, configurar e iniciar el proyecto localmente.       |
| 🏗️ **[Arquitectura](./docs/ARQUITECTURA.md)**       | Explicación de la estructura del frontend, backend y la base de datos híbrida. |
| 🗄️ **[Esquema de Base de Datos](./docs/DATABASE_SCHEMA.md)** | Detalles completos sobre cada tabla de SQLite y colección de MongoDB.          |
| 🔌 **[Documentación de la API](./docs/API_DOCUMENTATION.md)** | Referencia para todos los endpoints de la API, incluyendo parámetros y respuestas. |

## 🚀 Instalación Rápida

1.  **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/flavioGonz/adminflow.git
    cd adminflow
    ```

2.  **Instalar Dependencias:**
    ```bash
    # En una terminal, para el backend:
    cd server
    npm install

    # En otra terminal, para el frontend:
    cd client
    npm install
    ```

3.  **Configurar y Ejecutar:**
    Sigue las instrucciones detalladas en la **[Guía de Instalación Completa](./docs/INSTALL_GUIDE.md)** para configurar las variables de entorno y arrancar los servidores por primera vez.

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un "Issue" para discutir cambios importantes o un "Pull Request" con tus mejoras.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.