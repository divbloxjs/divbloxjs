# divbloxjs

The divbloxjs library is the core of an expanding collection of integrated packages for nodejs backend development.

divbloxjs is a data-driven framework that comes prepackaged with an ORM and a wrapper for expressjs that is preconfigured with JWT support.

# Getting Started

`npx divbloxjs-create-app`

This will generate a new divbloxjs project with all prerequisites and the recommended project structure.

# Configuration

divbloxjs's main configuration is done in the `dxconfig.json` file. Here you can configure app-specific information, environment setup, webserver (expressjs) configuration as well as package inclusion. More detailed documentation can be found
[here](https://github.com/divbloxjs/divbloxjs-create-app/blob/main/templates/configs/dxconfig-readme.md).

# How to build with divbloxjs

divbloxjs is meant to be used in a modular way, with a few core packages already implemented, many more to come, and a package-creator for the developer to implement any further functionality they may need.

Any specific functionality that the developer creates, will always reside inside of a package.

You can use remote packages by running the `npm run register-package` command, and entering the package name you would like to use, or you can create your own local ones by running `npx divbloxjs-package-generator` and following the prompts. More detailed documentation about divbloxjs packages can be found [here](https://github.com/divbloxjs/divbloxjs-create-app/blob/main/templates/infos/dx-packages-readme.md).
