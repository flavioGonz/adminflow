# 🚀 GUÍA DE REFERENCIA RÁPIDA

## Problema
```
❌ Error en http://192.168.99.120
Failed to load resource: 404 / 400
```

## Solución en 3 comandos

### Paso 1: Compilar (Windows PowerShell)
```powershell
cd C:\Users\Flavio\Documents\EXPRESS\adminflow\client
npm run build
cd ..
```

### Paso 2: Copiar a Alpine
```powershell
scp -r client\.next root@192.168.99.120:/root/adminflow/client/
scp -r client\public root@192.168.99.120:/root/adminflow/client/
scp server\index.js root@192.168.99.120:/root/adminflow/server/
```

### Paso 3: Reiniciar (SSH en Alpine)
```bash
ssh root@192.168.99.120
pm2 restart adminflow
```

## Verificar
- Abre: `http://192.168.99.120`
- F12 → Console: ✅ Sin errores 404/400
- F12 → Network: ✅ Todos los recursos con 200

---

## ¿Por qué funciona?

| Antes | Después |
|-------|---------|
| Express NO sirve `.next/` | Express SIRVE `.next/` |
| 404 en recursos CSS/JS | 200 OK en recursos |
| Página rota | Página funcional |

---

## Archivos Importantes

- 📄 `EXECUTIVE_SUMMARY.md` - Resumen en palabras simples
- 📄 `QUICK_FIX.md` - Pasos paso a paso
- 📄 `IMPLEMENTATION_CHECKLIST.md` - Checklist completo
- 📄 `STATIC_FILES_FIX.md` - Documentación técnica
- 🔧 `server/index.js` - Código modificado

---

## Tiempos

- Compilar: 2-5 min
- Copiar: 1-3 min
- Reiniciar: <1 min
- **Total: 5-10 min**

---

## Troubleshooting Rápido

```bash
# Ver logs
pm2 logs adminflow

# Verificar carpeta .next existe
ls -la /root/adminflow/client/.next/

# Probar que Express sirve archivos
curl -I http://localhost/_next/static/chunks/main.js
# Debería mostrar: 200 OK
```

---

## Cambios Realizados

✅ `server/index.js` - Agregado middleware para servir archivos Next.js
✅ Scripts de deploy creados
✅ Documentación completa

---

**Estado:** ✅ LISTO PARA IMPLEMENTAR

**Próximo paso:** Lee `QUICK_FIX.md` → Sigue `IMPLEMENTATION_CHECKLIST.md`
