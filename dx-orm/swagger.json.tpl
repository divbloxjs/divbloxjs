{
  "openapi": "3.0.3",
  "info": {
    "version": "[Version]",
    "title": "[Title]",
    "description": "[Description]"
  },
  "servers": [
    {
      "url": "/api",
      "description": "The server API root"
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