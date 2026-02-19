const fs = require('fs');
const path = '/opt/adminflow/server/swagger.json';
let swagger = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Add Tags
const newTags = [
    { name: "Users V2", description: "Gestión avanzada de técnicos y usuarios (v2)" },
    { name: "MongoDB Servers", description: "Gestión de múltiples instancias de bases de datos" }
];
newTags.forEach(tag => {
    if (!swagger.tags.find(t => t.name === tag.name)) {
        swagger.tags.push(tag);
    }
});

// 2. Add Push Key endpoint
swagger.paths["/api/push/key"] = {
    "get": {
        "tags": ["Push Notifications"],
        "summary": "Obtener VAPID Public Key",
        "description": "Retorna la llave pública necesaria para que el cliente se suscriba a WebPush",
        "responses": {
            "200": {
                "description": "OK",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "publicKey": { "type": "string" }
                            }
                        }
                    }
                }
            }
        }
    }
};

// 3. Update Push Send endpoint documentation
if (swagger.paths["/api/push/send"]) {
    swagger.paths["/api/push/send"].post.description = "Envía una notificación push real a todos los dispositivos suscritos usando web-push";
}

// 4. Add V2 Users endpoints
const userBase = "/api/v2/users";
swagger.paths[userBase] = {
    "get": {
        "tags": ["Users V2"],
        "summary": "Listar todos los usuarios (V2)",
        "responses": {
            "200": {
                "description": "Lista de usuarios",
                "content": {
                    "application/json": {
                        "schema": { "type": "array", "items": { "$ref": "#/components/schemas/UserV2" } }
                    }
                }
            }
        }
    },
    "post": {
        "tags": ["Users V2"],
        "summary": "Crear un nuevo usuario (V2)",
        "requestBody": {
            "required": true,
            "content": { "application/json": { "schema": { "$ref": "#/components/schemas/UserV2" } } }
        },
        "responses": { "201": { "description": "Creado" } }
    }
};

swagger.paths[`${userBase}/{id}`] = {
    "get": {
        "tags": ["Users V2"],
        "summary": "Obtener usuario por ID",
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "OK" } }
    },
    "patch": {
        "tags": ["Users V2"],
        "summary": "Actualizar usuario",
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "requestBody": { "content": { "application/json": { "schema": { "type": "object" } } } },
        "responses": { "200": { "description": "Actualizado" } }
    },
    "delete": {
        "tags": ["Users V2"],
        "summary": "Eliminar usuario",
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "Eliminado" } }
    }
};

swagger.paths[`${userBase}/{id}/avatar`] = {
    "post": {
        "tags": ["Users V2"],
        "summary": "Subir avatar de usuario",
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "requestBody": {
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": { "avatar": { "type": "string", "format": "binary" } }
                    }
                }
            }
        },
        "responses": { "200": { "description": "Avatar actualizado" } }
    }
};

// 5. Add Mongo Servers endpoints
const mongoBase = "/api/mongo-servers";
swagger.paths[mongoBase] = {
    "get": {
        "tags": ["MongoDB Servers"],
        "summary": "Listar servidores configurados",
        "responses": { "200": { "description": "OK" } }
    }
};
swagger.paths[`${mongoBase}/status`] = {
    "get": {
        "tags": ["MongoDB Servers"],
        "summary": "Verificar estado y colecciones de todos los servidores",
        "responses": { "200": { "description": "OK" } }
    }
};
swagger.paths[`${mongoBase}/{id}/switch`] = {
    "post": {
        "tags": ["MongoDB Servers"],
        "summary": "Cambiar la aplicación a un servidor específico",
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
        "responses": { "200": { "description": "Servidor cambiado" } }
    }
};

// 6. Add Schema UserV2
swagger.components.schemas.UserV2 = {
    "type": "object",
    "properties": {
        "id": { "type": "string" },
        "email": { "type": "string" },
        "name": { "type": "string" },
        "role": { "type": "string" },
        "avatar": { "type": "string", "nullable": true },
        "status": { "type": "string" }
    }
};

fs.writeFileSync(path, JSON.stringify(swagger, null, 2));
console.log('Swagger updated successfully!');
