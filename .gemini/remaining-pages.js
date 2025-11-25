#!/usr/bin/env node

// Script para agregar ShinyText e iconos a todas las páginas
// Páginas completadas: dashboard, system, clients, tickets

const pages = [
    {
        file: 'contracts/page.tsx',
        icon: 'FileSignature',
        gradient: 'from-violet-500 to-purple-600',
        title: 'Contratos',
        subtitle: 'Gestiona contratos y acuerdos',
        lineNumber: 124
    },
    {
        file: 'budgets/page.tsx',
        icon: 'Calculator',
        gradient: 'from-cyan-500 to-blue-600',
        title: 'Presupuestos',
        subtitle: 'Crea y gestiona presupuestos',
        lineNumber: 130
    },
    {
        file: 'products/page.tsx',
        icon: 'Package',
        gradient: 'from-orange-500 to-red-600',
        title: 'Productos y servicios',
        subtitle: 'Catálogo de productos y servicios',
        lineNumber: 208
    },
    {
        file: 'payments/page.tsx',
        icon: 'CreditCard',
        gradient: 'from-emerald-500 to-teal-600',
        title: 'Pagos',
        subtitle: 'Registro de pagos y transacciones',
        lineNumber: 760
    },
    {
        file: 'repository/page.tsx',
        icon: 'FolderArchive',
        gradient: 'from-slate-500 to-gray-600',
        title: 'Bóveda de archivos',
        subtitle: 'Repositorio de documentos',
        lineNumber: 370
    },
    {
        file: 'database/page.tsx',
        icon: 'Database',
        gradient: 'from-purple-500 to-indigo-600',
        title: 'Base de Datos',
        subtitle: 'Gestión de la base de datos',
        lineNumber: 296
    },
    {
        file: 'notifications/page.tsx',
        icon: 'Bell',
        gradient: 'from-red-500 to-pink-600',
        title: 'Configuración de Alertas',
        subtitle: 'Configura notificaciones y alertas',
        lineNumber: 449
    }
];

console.log('Páginas pendientes:', pages.length);
console.log(JSON.stringify(pages, null, 2));
