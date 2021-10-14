## Divblox Object Models

divbloxjs object models allow for an OOP approach to dealing with your project's data and 
are generated from the project's complete data model. For each entity 
defined in the data model, an object model base class is generated in `/dx-orm/generated`.

The developer is encouraged to create their own specializations for these object model classes
within their Divblox packages. Base object models simply allow for ease of use, specifically with
regards to code completion.