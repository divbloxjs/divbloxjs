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