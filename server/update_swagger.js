const fs = require('fs');
const path = '/opt/adminflow/server/swagger.json';
let swagger = JSON.parse(fs.readFileSync(path, 'utf8'));

swagger.components.schemas.Ticket = {
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "status": { "type": "string" },
    "priority": { "type": "string" },
    "amount": { "type": "number" },
    "amountCurrency": { "type": "string" },
    "clientId": { "type": "string" },
    "clientName": { "type": "string" },
    "clientEmail": { "type": "string" },
    "visit": { "type": "boolean" },
    "hasActiveContract": { "type": "boolean" },
    "assignedTo": { "type": "string", "nullable": true },
    "assignedGroupId": { "type": "string", "nullable": true },
    "annotations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": { "type": "string" },
          "user": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" }
        }
      }
    },
    "attachments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "url": { "type": "string" },
          "size": { "type": "number" },
          "type": { "type": "string" }
        }
      }
    },
    "audioNotes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "url": { "type": "string" },
          "durationSeconds": { "type": "number" }
        }
      }
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  }
};

fs.writeFileSync(path, JSON.stringify(swagger, null, 2));
console.log('Updated Swagger Ticket schema');
