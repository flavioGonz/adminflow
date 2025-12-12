# Guía de Instalación de AdminFlow

Esta guía detalla los pasos necesarios para configurar y ejecutar el proyecto AdminFlow en un entorno de desarrollo local.

## 1. Prerrequisitos

Asegúrate de tener los siguientes programas instalados en tu sistema:

- **Node.js**: (Versión 18.x o superior recomendada)
- **npm**: (Normalmente se instala junto con Node.js)
- **Git**: Para clonar el repositorio.

## 2. Clonar el Repositorio

Abre una terminal y clona el proyecto en tu máquina local:

```bash
git clone https://github.com/flavioGonz/adminflow.git
cd adminflow
```

## 3. Configuración del Backend (Servidor)

El servidor es una aplicación Express.js que se conecta tanto a SQLite como a MongoDB.

1.  **Navega al directorio del servidor:**
    ```bash
    cd server
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configuración de la Base de Datos:** El sistema tiene un proceso de instalación interactivo que se ejecuta en el navegador. Para habilitarlo, primero debes iniciar el servidor en modo de "no instalado". El servidor detectará que es la primera ejecución y te guiará.

4.  **Iniciar el Servidor por Primera Vez:**
    ```bash
    npm start
    ```
    El servidor se iniciará en `http://localhost:3001`. Al abrir esta URL en un navegador, deberías ver la página de instalación. Sigue los pasos en pantalla para configurar la base de datos (SQLite o MongoDB) y crear el usuario administrador.

    Una vez completada la instalación, se creará un archivo `.installed` en el directorio `server/`, y el servidor se reiniciará en modo normal.

## 4. Configuración del Frontend (Cliente)

El cliente es una aplicación Next.js.

1.  **Abre una nueva terminal** y navega al directorio del cliente:
    ```bash
    cd client
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configuración del Entorno:** El cliente necesita saber la URL del servidor de la API. Crea un archivo `.env.local` en el directorio `client/` a partir del archivo de ejemplo (si existe) o desde cero.

    **Contenido de `client/.env.local`:**
    ```
    NEXT_PUBLIC_API_URL=http://localhost:3001
    ```

4.  **Iniciar el Cliente:**
    ```bash
    npm run dev
    ```
    La aplicación cliente estará disponible en `http://localhost:3000`.

## 5. Resumen de Comandos

| Componente | Comando                    | Descripción                              |
| ---------- | -------------------------- | ---------------------------------------- |
| Servidor   | `cd server && npm install` | Instala las dependencias del backend.    |
| Servidor   | `npm start`                | Inicia el servidor de la API.            |
| Cliente    | `cd client && npm install` | Instala las dependencias del frontend.   |
| Cliente    | `npm run dev`              | Inicia el servidor de desarrollo del cliente. |

Una vez completados estos pasos, tendrás el entorno de AdminFlow funcionando localmente, con el cliente en el puerto 3000 y el servidor en el 3001.
