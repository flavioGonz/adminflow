const fs = require('fs');

const swaggerPath = '/opt/adminflow/server/swagger.json';
let swagger = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

// Add Push Notification endpoints
swagger.paths['/api/push/subscribe'] = {
  post: {
    tags: ['Push Notifications'],
    summary: 'Suscribir a notificaciones push',
    description: 'Registra una suscripción push para recibir notificaciones de escritorio',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['endpoint'],
            properties: {
              endpoint: {
                type: 'string',
                description: 'URL del endpoint push del navegador'
              },
              keys: {
                type: 'object',
                properties: {
                  p256dh: { type: 'string' },
                  auth: { type: 'string' }
                }
              },
              expirationTime: {
                type: 'string',
                nullable: true
              }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Suscripción registrada exitosamente',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' }
              }
            }
          }
        }
      },
      '400': {
        description: 'Datos de suscripción inválidos'
      }
    }
  }
};

swagger.paths['/api/push/unsubscribe'] = {
  post: {
    tags: ['Push Notifications'],
    summary: 'Desuscribir de notificaciones push',
    description: 'Elimina una suscripción push existente',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['endpoint'],
            properties: {
              endpoint: {
                type: 'string',
                description: 'URL del endpoint push a eliminar'
              }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Suscripción eliminada exitosamente'
      }
    }
  }
};

swagger.paths['/api/push/subscriptions'] = {
  get: {
    tags: ['Push Notifications'],
    summary: 'Listar suscripciones push',
    description: 'Obtiene todas las suscripciones push registradas',
    responses: {
      '200': {
        description: 'Lista de suscripciones',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  keys: { type: 'object' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }
};

swagger.paths['/api/push/send'] = {
  post: {
    tags: ['Push Notifications'],
    summary: 'Enviar notificación push',
    description: 'Envía una notificación push a todos los suscriptores',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['title'],
            properties: {
              title: {
                type: 'string',
                description: 'Título de la notificación'
              },
              body: {
                type: 'string',
                description: 'Cuerpo del mensaje'
              },
              url: {
                type: 'string',
                description: 'URL a abrir al hacer clic'
              },
              tag: {
                type: 'string',
                description: 'Tag para agrupar notificaciones'
              }
            }
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Notificación enviada',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                payload: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }
};

// Add tag if not exists
if (!swagger.tags) swagger.tags = [];
if (!swagger.tags.find(t => t.name === 'Push Notifications')) {
  swagger.tags.push({
    name: 'Push Notifications',
    description: 'Endpoints para gestión de notificaciones push de escritorio'
  });
}

fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
console.log('Updated swagger.json with push notification endpoints');
