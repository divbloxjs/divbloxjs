const DivbloxObjectBase = require("divbloxjs/dx-core-modules/object-base");
const fs = require("fs");
const path = require("path");
const dxUtils = require("dx-utilities");

const DIVBLOX_ROOT_DIR = path.join(__dirname, "..", "divbloxjs");

class CodeGenerator extends DivbloxObjectBase {
    constructor(dxInstance) {
        super();
        this.dxInstance = dxInstance;
        this.dataModelObj = this.dxInstance.dataModelObj;
        this.dataLayer = this.dxInstance.dataLayer;
        this.packages = this.dxInstance.packages;
    }

    async checkBaseGenerationComplete() {
        if (
            !fs.existsSync(DIVBLOX_ROOT_DIR + "/generated-base") ||
            !fs.existsSync(DIVBLOX_ROOT_DIR + "/generated-base/controllers") ||
            !fs.existsSync(DIVBLOX_ROOT_DIR + "/generated-base/data-series") ||
            !fs.existsSync(DIVBLOX_ROOT_DIR + "/generated-base/endpoints") ||
            !fs.existsSync(DIVBLOX_ROOT_DIR + "/generated-base/models")
            // CHECK THE local package folders as well
        ) {
            return false;
        }


        for (const entityName of Object.keys(this.dataModelObj)) {
            const casedEntityName = dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-");

            const controllerBasePath = DIVBLOX_ROOT_DIR + "/generated-base/controllers/" + casedEntityName + ".controller-base.js";
            const dataSeriesBasePath = DIVBLOX_ROOT_DIR + "/generated-base/data-series/" + casedEntityName + ".data-series-base.js";
            const endpointBasePath = DIVBLOX_ROOT_DIR + "/generated-base/endpoints/" + casedEntityName + ".endpoint-base.js";
            const modelBasePath = DIVBLOX_ROOT_DIR + "/generated-base/models/" + casedEntityName + ".model-base.js";
            const schemaPath = DIVBLOX_ROOT_DIR + "/generated-base/schemas/" + casedEntityName + ".schema.js";
            // const dataSeriesPath = "/divblox-orm/data-series/" + casedEntityName + ".data-series.js";
            // const modelPath = "/divblox-orm/models/" + casedEntityName + ".model.js";

            if (
                !fs.existsSync(controllerBasePath) ||
                !fs.existsSync(dataSeriesBasePath) ||
                !fs.existsSync(endpointBasePath) ||
                !fs.existsSync(modelBasePath) ||
                !fs.existsSync(schemaPath)
                // TODO Add local version of folders check
            ) {
                return false;
            }
        }

        return true;
    }

    async generateBaseSchemaAndModelClasses() {
        dxUtils.printSubHeadingMessage("Generating base ORM classes from data model specification");

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base");
        }

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/schemas")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base/schemas directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/schemas");
        }

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/models")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base/models directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/models");
        }

        const schemaComplete = {};

        for (const entityName of Object.keys(this.dataModelObj)) {
            dxUtils.printInfoMessage("Generating base model class for '" + entityName + "'...");

            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityName, "_"),
                "_",
            );
            const entityNameCamelCase = entityName;
            let entityData = "";
            let entitySchemaData = {
                id: {
                    type: "integer",
                    format: "int32",
                },
            };

            let entityModelSpec = 'static id = "' + this.dataLayer.getSqlReadyName(entityNameCamelCase) + '.id";\n';

            const attributes = this.dataModelObj[entityName]["attributes"];
            const relationships = this.dataModelObj[entityName]["relationships"];

            const attributeTypeMapping = {
                char: "string",
                varchar: "string",
                tinytext: "string",
                text: "string",
                mediumtext: "string",
                longtext: "string",
                binary: "string",
                varbinary: "string",
                tinyblob: "string",
                mediumblob: "string",
                blob: "string",
                longblob: "string",
                enum: "string",
                json: "string",
                date: "string",
                datetime: "string",
                timestamp: "integer",
                year: "integer",
                tinyint: "integer",
                smallint: "integer",
                mediumint: "integer",
                int: "integer",
                bigint: "integer",
                decimal: "number",
                float: "number",
                double: "number",
                real: "number",
                bit: "integer",
                boolean: "boolean",
                serial: "integer",
            };

            for (const attributeName of Object.keys(attributes)) {
                if (entityData.length > 0) {
                    entityData += "\n        ";
                }

                entityData += 'this.data["' + attributeName + '"] = ';
                const entityAttributeType =
                    typeof attributeTypeMapping[attributes[attributeName]["type"]] === "undefined"
                        ? "string"
                        : attributeTypeMapping[attributes[attributeName]["type"]];

                entitySchemaData[attributeName] = {
                    type: entityAttributeType,
                };

                entityModelSpec +=
                    "    static " +
                    attributeName +
                    ' = "' +
                    this.dataLayer.getSqlReadyName(entityNameCamelCase) +
                    "." +
                    this.dataLayer.getSqlReadyName(attributeName) +
                    '";\n';

                switch (attributes[attributeName]["type"]) {
                    case "date":
                        entitySchemaData[attributeName]["format"] = "date";
                        break;
                    case "datetime":
                        entitySchemaData[attributeName]["format"] = "date-time";
                        break;
                    case "float":
                        entitySchemaData[attributeName]["format"] = "float";
                        break;
                    case "double":
                        entitySchemaData[attributeName]["format"] = "double";
                        break;
                    case "enum":
                        const enumOptionsStr = attributes[attributeName].lengthOrValues;
                        const enumOptions = enumOptionsStr.replaceAll("'", "").split(",");
                        entitySchemaData[attributeName]["enum"] = enumOptions;
                        break;
                }

                if (typeof attributes[attributeName]["default"] === "undefined") {
                    entityData += "null;";
                    continue;
                }

                if (
                    attributes[attributeName]["default"] === null ||
                    attributes[attributeName]["default"] === "CURRENT_TIMESTAMP"
                ) {
                    entityData += "null;";
                    continue;
                }

                entityData +=
                    isNaN(attributes[attributeName]["default"]) || attributes[attributeName]["default"].length === 0
                        ? "'" + attributes[attributeName]["default"] + "';"
                        : attributes[attributeName]["default"].toString();
            }

            let linkedEntityRequires = "";
            let linkedEntityGetters = "";

            let fileContentObjectModelGettersStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/model/_base-model-getters.tpl",
                "utf-8",
            );

            for (const relationshipName of Object.keys(relationships)) {
                let linkedEntityRequiresForRelationship = "";
                let linkedEntityGettersForRelationship = "";

                for (const relationshipUniqueName of relationships[relationshipName]) {
                    const sqlReadyRelationshipName = this.dataLayer.getSqlReadyName(relationshipName);
                    const sqlReadyRelationshipUniqueName = this.dataLayer.getSqlReadyName(relationshipUniqueName);
                    const relationshipNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                        sqlReadyRelationshipName,
                        "_",
                    );
                    const lowerCaseSplitterRelationshipName = dxUtils.getCamelCaseSplittedToLowerCase(
                        relationshipName,
                        "-",
                    );

                    const finalRelationshipName = this.dataLayer.convertSqlNameToProperty(
                        sqlReadyRelationshipName + "_" + sqlReadyRelationshipUniqueName,
                    );

                    if (entityData.length > 0) {
                        entityData += "\n        ";
                    }

                    entityData += 'this.data["' + finalRelationshipName + '"] = null;';
                    entitySchemaData[finalRelationshipName] = {
                        type: "integer",
                        format: "int32",
                    };

                    entityModelSpec +=
                        "    static " +
                        finalRelationshipName +
                        ' = "' +
                        this.dataLayer.getSqlReadyName(entityNameCamelCase) +
                        "." +
                        this.dataLayer.getSqlReadyName(finalRelationshipName) +
                        '";\n';

                    if (linkedEntityRequiresForRelationship === "") {
                        linkedEntityRequiresForRelationship +=
                            "const " +
                            relationshipNamePascalCase +
                            " " +
                            ' = require("divbloxjs/dx-orm/generated/models/' +
                            lowerCaseSplitterRelationshipName +
                            '.model-base");\n';
                    }

                    if (linkedEntityGettersForRelationship === "") {
                        linkedEntityGettersForRelationship = fileContentObjectModelGettersStr;
                    }

                    const tokensToReplace = {
                        RelationshipNameCamelCase: relationshipName,
                        FinalRelationshipName: finalRelationshipName,
                        RelationshipNamePascalCase: relationshipNamePascalCase,
                        EntityNameCamelCase: entityNameCamelCase,
                    };

                    for (const token of Object.keys(tokensToReplace)) {
                        const search = "[" + token + "]";
                        linkedEntityGettersForRelationship = linkedEntityGettersForRelationship.replaceAll(
                            search,
                            tokensToReplace[token],
                        );
                    }
                }

                linkedEntityRequires += linkedEntityRequiresForRelationship;
                linkedEntityGetters += linkedEntityGettersForRelationship;
            }

            schemaComplete[entityName] = entitySchemaData;

            entityModelSpec += "    static __entityName" + ' = "' + entityNameCamelCase + '";\n';
            entityModelSpec +=
                "    static __moduleName" + ' = "' + this.dataLayer.getModuleNameFromEntityName(entityName) + '";\n';

            const tokensToReplace = {
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameCamelCase: entityNameCamelCase,
                EntityNameLowerCaseSplitted: dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-"),
                EntityData: entityData,
                EntitySchemaData: JSON.stringify(entitySchemaData, null, 2),
                EntityModelSpec: entityModelSpec,
                linkedEntityRequires: linkedEntityRequires,
                linkedEntityGetters: linkedEntityGetters,
            };

            let fileContentObjectModelStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/model/base-model.tpl",
                "utf-8",
            );
            let fileContentObjectSchemaStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/model/entity-schema.tpl",
                "utf-8",
            );

            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";
                fileContentObjectModelStr = fileContentObjectModelStr.replaceAll(search, tokensToReplace[token]);
                fileContentObjectSchemaStr = fileContentObjectSchemaStr.replaceAll(search, tokensToReplace[token]);
            }

            fs.writeFileSync(
                DIVBLOX_ROOT_DIR +
                    "/dx-code-gen/generated-base/models/" +
                    dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-") +
                    ".model-base.js",
                fileContentObjectModelStr,
            );

            fs.writeFileSync(
                DIVBLOX_ROOT_DIR +
                    "/dx-code-gen/generated-base/schemas/" +
                    dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-") +
                    ".schema.js",
                fileContentObjectSchemaStr,
            );
        }

        let fileContentDataModelSchemaStr = fs.readFileSync(
            DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/model/data-model-schema.tpl",
            "utf-8",
        );

        const search = "[SchemaData]";
        const replace = JSON.stringify(schemaComplete, null, 2);
        fileContentDataModelSchemaStr = fileContentDataModelSchemaStr.replaceAll(search, replace);

        fs.writeFileSync(
            DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/schemas/data-model.schema.js",
            fileContentDataModelSchemaStr,
        );
    }

    async generateBaseDataSeriesClasses() {
        dxUtils.printSubHeadingMessage("Generating base data-series classes from data model specification");

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base");
        }

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/data-series")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base/data-series directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/data-series");
        }

        for (const entityName of Object.keys(this.dataModelObj)) {
            dxUtils.printInfoMessage("Generating base data-series class for '" + entityName + "'...");

            const entityNameCamelCase = entityName;
            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityName, "_"),
                "_",
            );
            const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-")

            const tokensToReplace = {
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameCamelCase: entityNameCamelCase,
                EntityNameLowerCaseSplitted: entityNameKebabCase,
                relationshipConstraints: ""
            };

            let fileContentDataSeriesBaseStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/data-series/base-data-series.tpl",
                "utf-8",
            );
            let fileContentDataSeriesConstraintFunctionBaseStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/data-series/_base-data-series-constraints-function.tpl",
                "utf-8",
            );
            let fileContentDataSeriesConstraintBlockBaseStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/data-series/_base-data-series-constraint-block.tpl",
                "utf-8",
            );
    
            const relationshipNames = Object.keys(this.dataModelObj[entityName].relationships);

            let relationshipTokenReplacementString = fileContentDataSeriesConstraintFunctionBaseStr;
            relationshipTokenReplacementString = relationshipTokenReplacementString.replaceAll("[EntityNamePascalCase]", entityNamePascalCase)
            relationshipTokenReplacementString = relationshipTokenReplacementString.replaceAll("[EntityNameCamelCase]", entityNameCamelCase)
            let constraintBlocksStr = "";

            if (relationshipNames.length > 0) {
                relationshipNames.forEach(relationshipName => {
                    let relationshipBlock = fileContentDataSeriesConstraintBlockBaseStr;
                    for (const token of Object.keys(tokensToReplace)) {
                        const search = "[" + token + "]";
                        relationshipBlock = relationshipBlock.replaceAll(search, tokensToReplace[token]);
                    }
                    relationshipBlock = relationshipBlock.replaceAll("[RelatedEntityCamelCase]", relationshipName)
                    constraintBlocksStr += relationshipBlock;
                })
            }

            relationshipTokenReplacementString = relationshipTokenReplacementString.replaceAll("[constraintBlocks]", constraintBlocksStr);

            tokensToReplace.relationshipConstraints = relationshipTokenReplacementString;

            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";
                fileContentDataSeriesBaseStr = fileContentDataSeriesBaseStr.replaceAll(search, tokensToReplace[token]);
            }

            fs.writeFileSync(
                `${DIVBLOX_ROOT_DIR}/dx-code-gen/generated-base/data-series/${entityNameKebabCase}.data-series-base.js`,
                fileContentDataSeriesBaseStr,
            );
        }
    }

    async generateBaseEndpointClasses() {
        dxUtils.printSubHeadingMessage("Generating base endpoint classes from data model specification");

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base");
        }

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/endpoints")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base/endpoints directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/endpoints");
        }

        for (const entityName of Object.keys(this.dataModelObj)) {
            dxUtils.printInfoMessage("Generating base endpoint class for '" + entityName + "'...");
            const packageNameCamelCase = this.dataModelObj[entityName].packageNameCamelCase;
            const entityNameCamelCase = this.dataModelObj[entityName].singularEntityName ?? entityName;
            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "_"),
                "_",
            );
            const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "-")
            const entityNameCamelCasePlural = this.dataModelObj[entityName].pluralEntityName ?? this.pluralize(entityName);
            const entityNamePascalCasePlural = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCasePlural, "_"),
                "_",
            );
            const tokensToReplace = {
                EntityNameCamelCase: entityNameCamelCase,
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameLowerCaseSplitted: entityNameKebabCase,
                EntityNameCamelCasePlural: entityNameCamelCasePlural,
                EntityNamePascalCasePlural: entityNamePascalCasePlural,
                PackageNameCamelCase: packageNameCamelCase,
                AllRelationshipConstraintsStr: "",
                RelationshipDeclaredOperationList: ""
                
            };

            let fileContentEndpointBaseStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/endpoint/endpoint-base.tpl",
                "utf-8",
            );

            let fileContentConstraintDeclarationStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/endpoint/_constraint-declaration.tpl",
                "utf-8",
            );

            let allRelationshipConstraintDeclarationsStr = "";
            Object.keys(this.dataModelObj[entityName].relationships).forEach(relationshipName => {
                let relationshipConstraintDeclarationStr = fileContentConstraintDeclarationStr;
                const relatedEntityNameCamelCase = relationshipName;

                const relatedEntityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                    dxUtils.getCamelCaseSplittedToLowerCase(relatedEntityNameCamelCase, "_"),
                    "_",
                );

                const relatedEntityNameCamelCasePlural = this.dataModelObj[relationshipName].pluralEntityName ?? this.pluralize(relationshipName);
                const relatedEntityNamePascalCasePlural = dxUtils.convertLowerCaseToPascalCase(
                    dxUtils.getCamelCaseSplittedToLowerCase(relatedEntityNameCamelCasePlural, "_"),
                    "_",
                );

                const innerTokensToReplace = {
                    EntityNameCamelCase: tokensToReplace.EntityNameCamelCase,
                    EntityNamePascalCase: tokensToReplace.EntityNamePascalCase,
                    EntityNameLowerCaseSplitted: tokensToReplace.EntityNameKebabCase,
                    EntityNameCamelCasePlural: tokensToReplace.EntityNameCamelCasePlural,
                    EntityNamePascalCasePlural: tokensToReplace.EntityNamePascalCasePlural,
                    RelatedEntityNameCamelCase: relatedEntityNameCamelCase,
                    RelatedEntityNameCamelCasePlural: relatedEntityNameCamelCasePlural,
                    RelatedEntityNamePascalCase: relatedEntityNamePascalCase,
                    RelatedEntityNamePascalCasePlural: relatedEntityNamePascalCasePlural,
                }

                for (const token of Object.keys(innerTokensToReplace)) {
                    const search = "[" + token + "]";
                    relationshipConstraintDeclarationStr = relationshipConstraintDeclarationStr.replaceAll(search, innerTokensToReplace[token]);
                }
                tokensToReplace.RelationshipDeclaredOperationList += `\t\t\tthis.get${tokensToReplace.EntityNamePascalCasePlural}By${innerTokensToReplace.RelatedEntityNamePascalCase}OperationDeclaration,\n`
                allRelationshipConstraintDeclarationsStr += relationshipConstraintDeclarationStr;
            })

            if (allRelationshipConstraintDeclarationsStr.length > 0) {
                allRelationshipConstraintDeclarationsStr = `\t//#region Constrained-read endpoint definitions\n${allRelationshipConstraintDeclarationsStr}\n\t//#endregion`
            }

            tokensToReplace.AllRelationshipConstraintsStr = allRelationshipConstraintDeclarationsStr;
    
            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";
                fileContentEndpointBaseStr = fileContentEndpointBaseStr.replaceAll(search, tokensToReplace[token]);
            }

            fs.writeFileSync(
                `${DIVBLOX_ROOT_DIR}/dx-code-gen/generated-base/endpoints/${entityNameKebabCase}.endpoint-base.js`,
                fileContentEndpointBaseStr,
            );
        }
    }

    async generateBaseControllerClasses() {
        dxUtils.printSubHeadingMessage("Generating base controller classes from data model specification");

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base");
        }

        if (!fs.existsSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/controllers")) {
            dxUtils.printInfoMessage("Creating /dx-code-gen/generated-base/controllers directory...");
            fs.mkdirSync(DIVBLOX_ROOT_DIR + "/dx-code-gen/generated-base/controllers");
        }

        for (const entityName of Object.keys(this.dataModelObj)) {
            dxUtils.printInfoMessage("Generating base controller class for '" + entityName + "'...");
            const packageNameKebabCase = this.dataModelObj[entityName].packageName;
            const packageNameCamelCase = this.dataModelObj[entityName].packageNameCamelCase;
            console.log("packageNameCamelCase", packageNameCamelCase);
            const entityNameCamelCase = this.dataModelObj[entityName].singularEntityName ?? entityName;
            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "_"),
                "_",
            );
            const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "-")
            const entityNameCamelCasePlural = this.dataModelObj[entityName].pluralEntityName ?? this.pluralize(entityName);
            const entityNamePascalCasePlural = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCasePlural, "_"),
                "_",
            );
            const tokensToReplace = {
                EntityNameCamelCase: entityNameCamelCase,
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameLowerCaseSplitted: entityNameKebabCase,
                EntityNameCamelCasePlural: entityNameCamelCasePlural,
                EntityNamePascalCasePlural: entityNamePascalCasePlural,
                PackageNameKebabCase: packageNameKebabCase,
                PackageNameCamelCase: packageNameCamelCase,
            };

            let fileContentControllerBaseStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/controller/base-controller.tpl",
                "utf-8",
            );

    
            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";
                fileContentControllerBaseStr = fileContentControllerBaseStr.replaceAll(search, tokensToReplace[token]);
            }

            fs.writeFileSync(
                `${DIVBLOX_ROOT_DIR}/dx-code-gen/generated-base/controllers/${entityNameKebabCase}.controller-base.js`,
                fileContentControllerBaseStr,
            );
        }
    }

    pluralize(singularWord) {
        // Check for irregular plurals.
        const irregularPlurals = {
            // Add more irregular plurals as needed.
            child: 'children',
            person: 'people',
            ox: 'oxen',
            mouse: 'mice',
            man: 'men',
            woman: 'women',
            tooth: 'teeth',
            foot: 'feet',
            goose: 'geese',
            louse: 'lice',
            cactus: 'cacti',
            fungus: 'fungi',
            focus: 'foci',
            thesis: 'theses',
            analysis: 'analyses',
            diagnosis: 'diagnoses',
            phenomenon: 'phenomena',
            criterion: 'criteria',
            radius: 'radii',
            alumnus: 'alumni',
            appendix: 'appendices',
            index: 'indices',
            formula: 'formulae',
            syllabus: 'syllabi',
            bacterium: 'bacteria',
            curriculum: 'curricula',
            datum: 'data',
            analysis: 'analyses',
            axis: 'axes',
            crisis: 'crises',
            diagnosis: 'diagnoses',
            ellipsis: 'ellipses',
            hypothesis: 'hypotheses',
            thesis: 'theses',
            basis: 'bases',
            parenthesis: 'parentheses',
            oasis: 'oases',
            neurosis: 'neuroses',
        };

        if (irregularPlurals[singularWord]) {
            return irregularPlurals[singularWord];
        }

        // Handle regular plurals.
        if (singularWord.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(singularWord[singularWord.length - 2])) {
          return singularWord.slice(0, -1) + 'ies'; // Change "y" to "ies" for most cases.
        }
        
        if (singularWord.endsWith('s') || singularWord.endsWith('x') || singularWord.endsWith('z') || singularWord.endsWith('sh') || singularWord.endsWith('ch')) {
          return singularWord + 'es'; // Add "es" for certain endings.
        } 

        return singularWord + 's'; // Add "s" for most cases.
    }

    async generateDataSeriesSpecialisationClasses() {
        dxUtils.printSubHeadingMessage("Generating specialisation data series classes from data model specification");

        if (!fs.existsSync("divblox-packages-local")) {
            dxUtils.printInfoMessage("Creating /divblox-packages-local/ directory...");
            fs.mkdirSync("divblox-packages-local");
        }

        Object.keys(this.packages).forEach(packageName => {
            if (!fs.existsSync(`divblox-packages-local/${packageName}`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageName} directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageName}`);
            }

            if (!fs.existsSync(`divblox-packages-local/${packageName}/data-series`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageName}/data-series directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageName}/data-series`);
            }

            if (!fs.existsSync(`divblox-packages-local/${packageName}/endpoints`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageName}/endpoints directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageName}/endpoints`);
            }

            if (!fs.existsSync(`divblox-packages-local/${packageName}/models`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageName}/models directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageName}/models`);
            }

            if (!fs.existsSync(`divblox-packages-local/${packageName}/controllers`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageName}/controllers directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageName}/controllers`);
            }
        })
    
        for (const entityName of Object.keys(this.dataModelObj)) {
            const packageNameKebabCase = this.dataModelObj[entityName].packageName;
            if (!packageNameKebabCase) continue;

            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityName, "_"),
                "_",
            );
            const entityNameCamelCase = entityName;
            const entityNameLowerCaseSplitted = dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-");
            const attributes = this.dataModelObj[entityName]["attributes"];
            
            let entityAttributesStr = "";
            for (const attributeName of Object.keys(attributes)) {
                entityAttributesStr += entityNamePascalCase + "." + attributeName + ", ";
            }

            entityAttributesStr = entityAttributesStr.slice(0, -2);

            const tokensToReplace = {
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameCamelCase: entityNameCamelCase,
                EntityNameLowerCaseSplitted: entityNameLowerCaseSplitted,
                EntityAttributesStr: entityAttributesStr,
            };

            let fileContentDataSeriesSpecialisationStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/data-series/specialisation-data-series.tpl",
                "utf-8",
            );

            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";
                fileContentDataSeriesSpecialisationStr = fileContentDataSeriesSpecialisationStr.replaceAll(search, tokensToReplace[token]);
            }

            const finalPath = `divblox-packages-local/${packageNameKebabCase}/data-series/${entityNameLowerCaseSplitted}.data-series.js`
            if (!fs.existsSync(finalPath)) {
                dxUtils.printInfoMessage(`Generating ${entityNameLowerCaseSplitted}.data-series.js file`);
                fs.writeFileSync(finalPath, fileContentDataSeriesSpecialisationStr);
            } else {
                dxUtils.printInfoMessage(`Skipped existing file: ${entityNameLowerCaseSplitted}.data-series.js (If you wish to regenerate it - delete the current file)`);
            }
        }
    }

    async generateModelSpecialisationClasses() {
        dxUtils.printSubHeadingMessage("Generating specialisation model classes from data model specification");

        if (!fs.existsSync("divblox-packages-local")) {
            dxUtils.printInfoMessage("Creating /divblox-packages-local/ directory...");
            fs.mkdirSync("divblox-packages-local");
        }

        Object.keys(this.packages).forEach(packageName => {
            if (!fs.existsSync(`divblox-packages-local/${packageName}`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageName} directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageName}`);
            }

            if (!fs.existsSync(`divblox-packages-local/${packageName}/models`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageName}/models directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageName}/models`);
            }
        })

        for (const entityName of Object.keys(this.dataModelObj)) {
            const packageNameKebabCase = this.dataModelObj[entityName].packageNameKebabCase;
            if (!packageNameKebabCase) continue;

            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityName, "_"),
                "_",
            );
            const entityNameCamelCase = entityName;
            const entityNameLowerCaseSplitted = dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-");
            const attributes = this.dataModelObj[entityName]["attributes"];

            let entityAttributesStr = "";
            for (const attributeName of Object.keys(attributes)) {
                entityAttributesStr += entityNamePascalCase + "." + attributeName + ", ";
            }

            entityAttributesStr = entityAttributesStr.slice(0, -2);

            const tokensToReplace = {
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameCamelCase: entityNameCamelCase,
                EntityNameLowerCaseSplitted: entityNameLowerCaseSplitted,
                EntityAttributesStr: entityAttributesStr,
            };

            let fileContentModelBaseStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/model/specialisation-model.tpl",
                "utf-8",
            );

            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";
                fileContentModelBaseStr = fileContentModelBaseStr.replaceAll(search, tokensToReplace[token]);
            }

            const finalPath = `divblox-packages-local/${packageNameKebabCase}/models/${entityNameLowerCaseSplitted}.model.js`;
            if (!fs.existsSync(finalPath)) {
                dxUtils.printInfoMessage(`Creating ${entityNameLowerCaseSplitted}.model.js file...`);
                fs.writeFileSync(finalPath, fileContentModelBaseStr);
            } else {
                dxUtils.printInfoMessage(`Skipped existing file: ${entityNameLowerCaseSplitted}.model.js (If you wish to regenerate it - delete the current file)`);
            }
        }
    }

    async generateEndpointSpecialisationClasses() {
        dxUtils.printSubHeadingMessage("Generating specialisation endpoint classes from data model specification");

        if (!fs.existsSync("divblox-packages-local")) {
            dxUtils.printInfoMessage("Creating /divblox-packages-local/ directory...");
            fs.mkdirSync("divblox-packages-local");
        }

        Object.keys(this.packages).forEach(packageNameKebabCase => {
            if (!fs.existsSync(`divblox-packages-local/${packageNameKebabCase}`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageNameKebabCase} directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageNameKebabCase}`);
            }

            if (!fs.existsSync(`divblox-packages-local/${packageNameKebabCase}/endpoints`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageNameKebabCase}/endpoints directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageNameKebabCase}/endpoints`);
            }
        })

        for (const entityName of Object.keys(this.dataModelObj)) {
            const packageNameKebabCase = this.dataModelObj[entityName].packageName;
            if (!packageNameKebabCase) continue;

            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityName, "_"),
                "_",
            );
            const entityNameCamelCase = entityName;
            const entityNameLowerCaseSplitted = dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-");
            const attributes = this.dataModelObj[entityName]["attributes"];

            let entityAttributesStr = "";
            for (const attributeName of Object.keys(attributes)) {
                entityAttributesStr += entityNamePascalCase + "." + attributeName + ", ";
            }

            entityAttributesStr = entityAttributesStr.slice(0, -2);

            const tokensToReplace = {
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameCamelCase: entityNameCamelCase,
                EntityNameLowerCaseSplitted: entityNameLowerCaseSplitted,
                EntityAttributesStr: entityAttributesStr,
            };

            let fileContentModelBaseStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/endpoint/specialisation-endpoint.tpl",
                "utf-8",
            );

            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";
                fileContentModelBaseStr = fileContentModelBaseStr.replaceAll(search, tokensToReplace[token]);
            }

            const finalPath = `divblox-packages-local/${packageNameKebabCase}/endpoints/${entityNameLowerCaseSplitted}.endpoint.js`;
            if (!fs.existsSync(finalPath)) {
                dxUtils.printInfoMessage(`Creating ${entityNameLowerCaseSplitted}.endpoint.js file...`);
                fs.writeFileSync(finalPath, fileContentModelBaseStr);
            } else {
                dxUtils.printInfoMessage(`Skipped existing file: ${entityNameLowerCaseSplitted}.endpoint.js (If you wish to regenerate it - delete the current file)`);
            }
        }
    }

    async generateControllerSpecialisationClasses() {
        dxUtils.printSubHeadingMessage("Generating specialisation controller classes from data model specification");

        if (!fs.existsSync("divblox-packages-local")) {
            dxUtils.printInfoMessage("Creating /divblox-packages-local/ directory...");
            fs.mkdirSync("divblox-packages-local");
        }

        Object.keys(this.packages).forEach(packageNameKebabCase => {
            if (!fs.existsSync(`divblox-packages-local/${packageNameKebabCase}`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageNameKebabCase} directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageNameKebabCase}`);
            }

            if (!fs.existsSync(`divblox-packages-local/${packageNameKebabCase}/controllers`)) {
                dxUtils.printInfoMessage(`Creating /divblox-packages-local/${packageNameKebabCase}/controllers directory...`);
                fs.mkdirSync(`divblox-packages-local/${packageNameKebabCase}/controllers`);
            }
        })

        for (const entityName of Object.keys(this.dataModelObj)) {
            const packageNameKebabCase = this.dataModelObj[entityName].packageName;
            const packageNameCamelCase = this.dataModelObj[entityName].packageNameCamelCase;
            if (!packageNameKebabCase) continue;

            const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(
                dxUtils.getCamelCaseSplittedToLowerCase(entityName, "_"),
                "_",
            );
            const entityNameCamelCase = entityName;
            const entityNameLowerCaseSplitted = dxUtils.getCamelCaseSplittedToLowerCase(entityName, "-");

            const tokensToReplace = {
                EntityNamePascalCase: entityNamePascalCase,
                EntityNameCamelCase: entityNameCamelCase,
                EntityNameLowerCaseSplitted: entityNameLowerCaseSplitted,
                PackageNameKebabCase: packageNameKebabCase,
                PackageNameCamelCase: packageNameCamelCase,
            };

            let fileContentModelBaseStr = fs.readFileSync(
                DIVBLOX_ROOT_DIR + "/dx-code-gen/gen-templates/controller/specialisation-controller.tpl",
                "utf-8",
            );

            for (const token of Object.keys(tokensToReplace)) {
                const search = "[" + token + "]";
                fileContentModelBaseStr = fileContentModelBaseStr.replaceAll(search, tokensToReplace[token]);
            }

            const finalPath = `divblox-packages-local/${packageNameKebabCase}/controllers/${entityNameLowerCaseSplitted}.controller.js`;
            if (!fs.existsSync(finalPath)) {
                dxUtils.printInfoMessage(`Creating ${entityNameLowerCaseSplitted}.controller.js file...`);
                fs.writeFileSync(finalPath, fileContentModelBaseStr);
            } else {
                dxUtils.printInfoMessage(`Skipped existing file: ${entityNameLowerCaseSplitted}.controller.js (If you wish to regenerate it - delete the current file)`);
            }
        }
    }
}

module.exports = CodeGenerator;