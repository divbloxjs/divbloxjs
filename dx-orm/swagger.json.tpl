{
  "openapi": "3.0.3",
  "info": {
    "version": "1.0.0",
    "title": "[Title]",
    "description": "[Description]"
  },
  "servers": [
    {
      "url": "/api/",
      "description": "The server api root"
    }
  ],
  "tags": [Tags],
  "paths": [Paths],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer"
      }
    },
    "jwt": {
      "in": "header",
      "name": "Authorization",
      "required": true,
      "description": "JSON Web Token",
      "schema": {
        "$ref": "#/components/auth"
      }
    },
    "auth": {
      "properties": {
        "Bearer": {
          "type": "string"
        }
      }
    },
    "message" : {
      "properties": {
        "msg": {
          "type": "string"
        }
      }
    },
    "schemas": [Schemas]
  }
}