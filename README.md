# divbloxjs

## Summary

The divbloxjs library is the core of a expanding collection of integrated packages for backend development.

Divbloxjs is a data-driven nodejs backend packaged with an ORM, and JWT support.

## Getting Started

`npx divbloxjs-create-app`

This will generate a new divblox js project with all prerequisites.

## Configuration

Divbloxjs's main configuration is done in the `dxconfig.json` file. Here you can configure app-specific information, environment setup, webserver (expressjs) configuration as well as package inclusion. For detailed documentation, click
[here](https://github.com/divbloxjs/divbloxjs-create-app/blob/main/templates/configs/dxconfig-readme.md).

## Extending functionality

Divbloxjs is meant to be used modularly, with a few core packages already implemented, many more to come, and a package-creator for the developer to implement any further packages they need. You can use any existing packages from remote locations by using the `npm run register-package` command, and entering the package name you would like to use, or you can create your own local ones by running `npx divbloxjs-package-generator` and follwing the prompts. For more detailed documentation refer [here](https://github.com/divbloxjs/divbloxjs-create-app/blob/main/templates/infos/dx-packages-readme.md).
