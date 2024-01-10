const DivbloxObjectBase = require("divbloxjs/dx-core-modules/object-base");
const fs = require("fs");
const path = require("path");
const dxUtils = require("dx-utilities");

const DIVBLOX_ROOT_DIR = path.join(__dirname, "..", "divbloxjs");
const GEN_TEMPLATE_DIR = `${DIVBLOX_ROOT_DIR}/dx-code-gen/gen-templates`;
const BASE_GEN_FILES_DIR = `${DIVBLOX_ROOT_DIR}/dx-code-gen/generated-base`;

class CodeGenerator extends DivbloxObjectBase {
    corePackageName = "_core";
    constructor(dxInstance) {
        super();
        this.dxInstance = dxInstance;
        this.dataModelObj = this.dxInstance.dataModelObj;
        this.dataLayer = this.dxInstance.dataLayer;
        this.packages = this.dxInstance.packages;
    }

    async checkAndCreateNecessaryFolders() {
        // Generated-base folder
        if (!fs.existsSync(`${BASE_GEN_FILES_DIR}`)) {
            fs.mkdirSync(`${BASE_GEN_FILES_DIR}`);
            dxUtils.printSuccessMessage(`Created /dx-code-gen/generated-base directory`);
        } else {
            dxUtils.printInfoMessage(`Skipped /dx-code-gen/generated-base directory (exists)`);
        }

        if (!fs.existsSync(`divblox-packages-local/${this.corePackageName}`)) {
            fs.mkdirSync(`divblox-packages-local/${this.corePackageName}`);
            dxUtils.printSuccessMessage(`Created divblox-packages-local/${this.corePackageName} directory`);
        } else {
            dxUtils.printInfoMessage(`Skipped divblox-packages-local/${this.corePackageName} directory (exists)`);
        }

        Object.keys(this.packages).forEach(packageNameKebabCase => {
            // Package folder
            if (!fs.existsSync(`divblox-packages-local/${packageNameKebabCase}`)) {
                fs.mkdirSync(`divblox-packages-local/${packageNameKebabCase}`);
                dxUtils.printSuccessMessage(`Created /divblox-packages-local/${packageNameKebabCase} directory`);
            } else {
                dxUtils.printInfoMessage(`Skipped /divblox-packages-local/${packageNameKebabCase} directory (exists)`);
            }
        })


        for (const entityNameCamelCase of Object.keys(this.dataModelObj)) {
            const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "-");

            const entityDataModel = this.dataModelObj[entityNameCamelCase];

            const packageNameKebabCase = entityDataModel.packageName ?? this.corePackageName;

            // Base entity folder
            if (!fs.existsSync(`${BASE_GEN_FILES_DIR}/${entityNameKebabCase}`)) {
                fs.mkdirSync(`${BASE_GEN_FILES_DIR}/${entityNameKebabCase}`);
                dxUtils.printSuccessMessage(`Created /dx-code-gen/generated-base/${entityNameKebabCase} directory`);
            } else {
                dxUtils.printInfoMessage(`Skipped /dx-code-gen/generated-base/${entityNameKebabCase} directory (exists)`);
            }

            // Specialisation entity folder
            if (!fs.existsSync(`divblox-packages-local/${packageNameKebabCase}/${entityNameKebabCase}`)) {
                fs.mkdirSync(`divblox-packages-local/${packageNameKebabCase}/${entityNameKebabCase}`);
                dxUtils.printSuccessMessage(`Created divblox-packages-local/${packageNameKebabCase}/${entityNameKebabCase} directory`);
            } else {
                dxUtils.printInfoMessage(`Skipped divblox-packages-local/${packageNameKebabCase}/${entityNameKebabCase} directory (exists)`);
            }
        }
    }

    async generateBaseClasses() {
        dxUtils.printSubHeadingMessage("Generating base classes from data model specification");

        const schemaComplete = {};
        for (const entityNameCamelCase of Object.keys(this.dataModelObj)) {
            await this.#generateBaseModelAndSchemaClassForEntity(entityNameCamelCase, this.dataModelObj[entityNameCamelCase], schemaComplete);
            await this.#generateDataSeriesClassForEntity(entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
            await this.#generateBaseEndpointClassForEntity(entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
            await this.#generateBaseControllerClassForEntity(entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);

            dxUtils.printSuccessMessage(`Generated base controller|data-series|endpoint|model|schema classes for '${entityNameCamelCase}'`);
        }

        let fileContentDataModelSchemaStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/model/data-model-schema.tpl`, "utf-8");

        const search = "[SchemaData]";
        const replace = JSON.stringify(schemaComplete, null, 2);
        fileContentDataModelSchemaStr = fileContentDataModelSchemaStr.replaceAll(search, replace);

        fs.writeFileSync(`${BASE_GEN_FILES_DIR}/data-model.schema.js`, fileContentDataModelSchemaStr);
        dxUtils.printSuccessMessage("Generated base data-model.schema.js");
    }

    //#region Base class generators
    async #generateBaseModelAndSchemaClassForEntity(entityNameCamelCase, entityDataModel, schemaComplete) {
        const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "-")
        const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(entityNameKebabCase, "-");
        const entityNameSqlCase = this.dataLayer.getSqlReadyName(entityNameCamelCase);

        const packageNameKebabCase = entityDataModel.packageName ?? this.corePackageName;
        const packageNameCamelCase = entityDataModel.packageNameCamelCase;

        let entityData = "";
        let entitySchemaData = {
            id: {
                type: "integer",
                format: "int32",
            },
        };

        let entityModelSpec = `static id = "${entityNameSqlCase}'.id";\n`;

        let userEditableFields = `static userEditableFields = [\n`;

        const attributes = entityDataModel["attributes"];
        const relationships = entityDataModel["relationships"];

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

        for (const attributeNameCamelCase of Object.keys(attributes)) {
            const attributeNameSqlCase = this.dataLayer.getSqlReadyName(attributeNameCamelCase);
            if (entityData.length > 0) {
                entityData += `\n        `;
            }

            entityData += `this.data["${attributeNameCamelCase}"] = `;
            const entityAttributeType = attributeTypeMapping[attributes[attributeNameCamelCase]["type"]] ?? "string";

            entitySchemaData[attributeNameCamelCase] = {
                type: entityAttributeType,
            };

            entityModelSpec += `    static ${attributeNameCamelCase} = "${entityNameSqlCase}.${attributeNameSqlCase}";\n`
            userEditableFields += `        "${attributeNameCamelCase}",\n`;

            switch (attributes[attributeNameCamelCase]["type"]) {
                case "date":
                    entitySchemaData[attributeNameCamelCase]["format"] = "date";
                    break;
                case "datetime":
                    entitySchemaData[attributeNameCamelCase]["format"] = "date-time";
                    break;
                case "float":
                    entitySchemaData[attributeNameCamelCase]["format"] = "float";
                    break;
                case "double":
                    entitySchemaData[attributeNameCamelCase]["format"] = "double";
                    break;
                case "enum":
                    const enumOptions = attributes[attributeNameCamelCase].lengthOrValues;
                    if (Array.isArray(enumOptions)) {
                        entitySchemaData[attributeNameCamelCase]["enum"] = enumOptions;
                        break;
                    }
                    const finalEnumOptions = enumOptions.replaceAll("'", "").split(",");
                    entitySchemaData[attributeNameCamelCase]["enum"] = finalEnumOptions;
                    break;
            }

            const attributeDefault = attributes[attributeNameCamelCase]["default"];
            if (typeof attributeDefault === "undefined") {
                entityData += "null;";
                continue;
            }

            if (
                attributeDefault === null ||
                attributeDefault === "CURRENT_TIMESTAMP"
            ) {
                entityData += "null;";
                continue;
            }

            entityData +=
                isNaN(attributeDefault) || attributeDefault.length === 0
                    ? `'${attributeDefault}';`
                    : attributeDefault.toString();
        }

        let linkedEntityRequires = "";
        let linkedEntityGetters = "";

        let fileContentObjectModelGettersStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/model/_base-model-getters.tpl`, "utf-8");

        for (const relationshipNameCamelCase of Object.keys(relationships)) {
            const relationshipNameSqlCase = this.dataLayer.getSqlReadyName(relationshipNameCamelCase);
            const relationshipNamePascalCase = dxUtils.convertLowerCaseToPascalCase(relationshipNameSqlCase, "_");
            const relationshipNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(relationshipNameCamelCase, "-");

            let linkedEntityRequiresForRelationship = "";
            let linkedEntityGettersForRelationship = "";

            for (const relationshipUniqueNameCamelCase of relationships[relationshipNameCamelCase]) {
                const relationshipUniqueNamePascalCase = dxUtils.convertCamelCaseToPascalCase(relationshipUniqueNameCamelCase);
                const finalRelationshipNameCamelCase = `${relationshipNameCamelCase}${relationshipUniqueNamePascalCase}`;
                const finalRelationshipNameSqlCase = this.dataLayer.getSqlReadyName(finalRelationshipNameCamelCase);

                if (entityData.length > 0) {
                    entityData += "\n        ";
                }

                entityData += `this.data["${finalRelationshipNameCamelCase}"] = null;`;
                entitySchemaData[finalRelationshipNameCamelCase] = {
                    type: "integer",
                    format: "int32",
                };

                entityModelSpec += `    static ${relationshipNameCamelCase} = "${entityNameSqlCase}.${finalRelationshipNameSqlCase}";\n`
                userEditableFields += `        "${finalRelationshipNameCamelCase}",\n`;

                if (linkedEntityRequiresForRelationship === "") {
                    linkedEntityRequiresForRelationship +=
                        `const ${relationshipNamePascalCase} = require("divbloxjs/dx-code-gen/generated-base/${relationshipNameKebabCase}/${relationshipNameKebabCase}.model-base");\n`
                }

                if (linkedEntityGettersForRelationship === "") {
                    linkedEntityGettersForRelationship = fileContentObjectModelGettersStr;
                }

                const tokensToReplace = {
                    RelationshipNameCamelCase: relationshipNameCamelCase,
                    FinalRelationshipName: finalRelationshipNameCamelCase, // TODO check if used
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

        schemaComplete[entityNameCamelCase] = entitySchemaData;

        entityModelSpec += `\n    static __entityName = "${entityNameCamelCase}";\n`;
        entityModelSpec += `    static __moduleName = "${this.dataLayer.getModuleNameFromEntityName(entityNameCamelCase)}";\n`;

        userEditableFields += `    ]\n`;

        const tokensToReplace = {
            EntityNamePascalCase: entityNamePascalCase,
            EntityNameCamelCase: entityNameCamelCase,
            EntityNameKebabCase: entityNameKebabCase,
            PackageNameKebabCase: packageNameKebabCase,
            EntityData: entityData,
            EntitySchemaData: JSON.stringify(entitySchemaData, null, 2),
            EntityModelSpec: entityModelSpec,
            UserEditableFields: userEditableFields,
            LinkedEntityRequires: linkedEntityRequires,
            LinkedEntityGetters: linkedEntityGetters,
        };

        let fileContentObjectModelStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/model/base-model.tpl`, "utf-8");
        let fileContentObjectSchemaStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/model/entity-schema.tpl`, "utf-8");

        for (const token of Object.keys(tokensToReplace)) {
            const search = "[" + token + "]";
            fileContentObjectModelStr = fileContentObjectModelStr.replaceAll(search, tokensToReplace[token]);
            fileContentObjectSchemaStr = fileContentObjectSchemaStr.replaceAll(search, tokensToReplace[token]);
        }

        fs.writeFileSync(`${BASE_GEN_FILES_DIR}/${entityNameKebabCase}/${entityNameKebabCase}.model-base.js`, fileContentObjectModelStr);
        fs.writeFileSync(`${BASE_GEN_FILES_DIR}/${entityNameKebabCase}/${entityNameKebabCase}.schema-base.js`, fileContentObjectSchemaStr);
    }

    async #generateDataSeriesClassForEntity(entityNameCamelCase, entityDataModel) {
        const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "-");
        const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(entityNameKebabCase, "-");

        const packageNameKebabCase = entityDataModel.packageName ?? this.corePackageName;
        const packageNameCamelCase = entityDataModel.packageNameCamelCase;

        const tokensToReplace = {
            EntityNameCamelCase: entityNameCamelCase,
            EntityNamePascalCase: entityNamePascalCase,
            EntityNameKebabCase: entityNameKebabCase,
            PackageNameKebabCase: packageNameKebabCase,
        };

        let fileBaseStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/data-series/base-data-series.tpl`, "utf-8");
        let fileConstraintFunctionStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/data-series/_base-data-series-relationships-function.tpl`, "utf-8");
        let fileConstraintBlockStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/data-series/_base-data-series-relationship-block.tpl`, "utf-8");

        const relationshipNames = Object.keys(entityDataModel.relationships);

        let relationshipTokenReplacementStr = fileConstraintFunctionStr;
        relationshipTokenReplacementStr = relationshipTokenReplacementStr.replaceAll("[EntityNamePascalCase]", entityNamePascalCase)
        relationshipTokenReplacementStr = relationshipTokenReplacementStr.replaceAll("[EntityNameCamelCase]", entityNameCamelCase)
        let relationshipBlocksStr = "";

        if (relationshipNames.length > 0) {
            relationshipNames.forEach(relationshipNameCamelCase => {
                let relationshipBlock = fileConstraintBlockStr;
                for (const token of Object.keys(tokensToReplace)) {
                    const search = "[" + token + "]";
                    relationshipBlock = relationshipBlock.replaceAll(search, tokensToReplace[token]);
                }
                relationshipBlock = relationshipBlock.replaceAll("[RelatedEntityCamelCase]", relationshipNameCamelCase)
                relationshipBlocksStr += relationshipBlock;
            })
        }

        relationshipTokenReplacementStr = relationshipTokenReplacementStr.replaceAll("[RelationshipBlocks]", relationshipBlocksStr);

        tokensToReplace.relationshipConstraints = relationshipTokenReplacementStr;

        for (const token of Object.keys(tokensToReplace)) {
            const search = "[" + token + "]";
            fileBaseStr = fileBaseStr.replaceAll(search, tokensToReplace[token]);
        }

        fs.writeFileSync(`${BASE_GEN_FILES_DIR}/${entityNameKebabCase}/${entityNameKebabCase}.data-series-base.js`, fileBaseStr);
    }

    async #generateBaseEndpointClassForEntity(entityNameCamelCase, entityDataModel) {
        entityNameCamelCase = entityDataModel.singularEntityName ?? entityNameCamelCase;
        const entityNamePascalCase = dxUtils.convertLowerCaseToPascalCase(entityNameCamelCase, "-");
        const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "-");

        const entityNameCamelCasePlural = entityDataModel.pluralEntityName ?? this.pluralize(entityNameCamelCase);
        const entityNamePascalCasePlural = dxUtils.convertCamelCaseToPascalCase(entityNameCamelCasePlural);

        const packageNameKebabCase = entityDataModel.packageName ?? this.corePackageName;
        const packageNameCamelCase = entityDataModel.packageNameCamelCase;

        let allowedAccessStr = '["anonymous"]';
        if (entityDataModel.hasOwnProperty("allowedAccess")) {
            if (Array.isArray(entityDataModel.allowedAccess)) {
                if (entityDataModel.allowedAccess.length === 0) {
                    allowedAccessStr = `[]`;
                } else if (entityDataModel.allowedAccess.includes("anonymous")) {
                    allowedAccessStr = `["anonymous"]`;
                } else {
                    allowedAccessStr = `['${entityDataModel.allowedAccess.join("', '")}']`
                }
            }
        }

        console.log("allowedAccessStr", allowedAccessStr);
        const tokensToReplace = {
            EntityNameCamelCase: entityNameCamelCase,
            EntityNamePascalCase: entityNamePascalCase,
            EntityNameKebabCase: entityNameKebabCase,
            EntityNameCamelCasePlural: entityNameCamelCasePlural,
            EntityNamePascalCasePlural: entityNamePascalCasePlural,
            PackageNameCamelCase: packageNameCamelCase,
            PackageNameKebabCase: packageNameKebabCase,
            AllowedAccess: allowedAccessStr,
            AllRelationshipConstraintsStr: "",
            RelationshipDeclaredOperationList: ""
            
        };

        let fileBaseStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/endpoint/endpoint-base.tpl`, "utf-8");
        let fileRelationshipDeclarationStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/endpoint/_relationship-declaration.tpl`, "utf-8");

        let allRelationshipsDeclarationsStr = "";
        Object.keys(entityDataModel.relationships).forEach(relationshipNameCamelCase => {
            let relationshipConstraintDeclarationStr = fileRelationshipDeclarationStr;
            const relatedEntityNameCamelCase = relationshipNameCamelCase;
            const relatedEntityNamePascalCase = dxUtils.convertCamelCaseToPascalCase(relatedEntityNameCamelCase);

            const relatedEntityNameCamelCasePlural = this.dataModelObj[relationshipNameCamelCase].pluralEntityName ?? this.pluralize(relationshipNameCamelCase);
            const relatedEntityNamePascalCasePlural = dxUtils.convertCamelCaseToPascalCase(relatedEntityNameCamelCasePlural);

            const innerTokensToReplace = {
                EntityNameCamelCase: tokensToReplace.EntityNameCamelCase,
                EntityNamePascalCase: tokensToReplace.EntityNamePascalCase,
                EntityNameKebabCase: tokensToReplace.EntityNameKebabCase,
                EntityNameCamelCasePlural: tokensToReplace.EntityNameCamelCasePlural,
                EntityNamePascalCasePlural: tokensToReplace.EntityNamePascalCasePlural,
                AllowedAccess: allowedAccessStr,
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
            allRelationshipsDeclarationsStr += relationshipConstraintDeclarationStr;
        })

        if (allRelationshipsDeclarationsStr.length > 0) {
            allRelationshipsDeclarationsStr = `\t//#region Relationship-constrained endpoint definitions\n${allRelationshipsDeclarationsStr}\n\t//#endregion`
        }

        tokensToReplace.AllRelationshipConstraintsStr = allRelationshipsDeclarationsStr;

        for (const token of Object.keys(tokensToReplace)) {
            const search = "[" + token + "]";
            fileBaseStr = fileBaseStr.replaceAll(search, tokensToReplace[token]);
        }

        fs.writeFileSync(`${BASE_GEN_FILES_DIR}/${entityNameKebabCase}/${entityNameKebabCase}.endpoint-base.js`, fileBaseStr);
    }

    async #generateBaseControllerClassForEntity(entityNameCamelCase, entityDataModel) {
        entityNameCamelCase = entityDataModel.singularEntityName ?? entityNameCamelCase;
        const entityNamePascalCase = dxUtils.convertCamelCaseToPascalCase(entityNameCamelCase);
        const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "-");

        const entityNameCamelCasePlural = entityDataModel.pluralEntityName ?? this.pluralize(entityNameCamelCase);
        const entityNamePascalCasePlural = dxUtils.convertCamelCaseToPascalCase(entityNameCamelCasePlural);

        const packageNameKebabCase = entityDataModel.packageName ?? this.corePackageName;
        const packageNameCamelCase = entityDataModel.packageNameCamelCase;

        const tokensToReplace = {
            EntityNameCamelCase: entityNameCamelCase,
            EntityNamePascalCase: entityNamePascalCase,
            EntityNameLowerCaseSplitted: entityNameKebabCase,
            EntityNameCamelCasePlural: entityNameCamelCasePlural,
            EntityNamePascalCasePlural: entityNamePascalCasePlural,
            PackageNameKebabCase: packageNameKebabCase,
            PackageNameCamelCase: packageNameCamelCase,
            ShowRelationshipDeclarations: "",
            RelationshipOptions: "",
            RelationshipReturnOptions: ""
        };

        let fileBaseStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/controller/base-controller.tpl`, "utf-8");
        let fileContentRelationshipOptionsStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/controller/_base-relationship-options.tpl`, "utf-8");
        
        let relationshipOptionsStr = "";
        let relationshipOptionDelclarationsStr = "";
        let relationshipReturnOptionsStr = "";
        for (const relatedEntityNameCamelCase of Object.keys(entityDataModel.relationships)) {
            const relatedEntityNamePascalCase = dxUtils.convertCamelCaseToPascalCase(relatedEntityNameCamelCase);
            const relatedEntityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(relatedEntityNameCamelCase, "-");
            
            let currentRelationshipOptionStr = fileContentRelationshipOptionsStr;

            currentRelationshipOptionStr = currentRelationshipOptionStr.replaceAll("[EntityNameCamelCase]", relatedEntityNameCamelCase);
            currentRelationshipOptionStr = currentRelationshipOptionStr.replaceAll("[EntityNamePascalCase]", relatedEntityNamePascalCase);

            relationshipOptionsStr += currentRelationshipOptionStr;
            relationshipReturnOptionsStr += `            ${relatedEntityNameCamelCase}Options: ${relatedEntityNameCamelCase}DataArr,\n`
            relationshipOptionDelclarationsStr += `const ${relatedEntityNamePascalCase}DataSeries = require('../../../../../divblox-packages-local/test-package/${relatedEntityNameKebabCase}/${relatedEntityNameKebabCase}.data-series');\n`
        }

        if (relationshipOptionsStr.length > 0) {
            relationshipOptionsStr = "        const relationshipDataSeriesConfig = {\n"+
            "\t\t\tlimit: 20,\n"+ 
            "\t\t\trelationshipDepth: 0,\n" +
            "\t\t}\n" + 
            relationshipOptionsStr;
        }

        tokensToReplace.ShowRelationshipDeclarations = relationshipOptionDelclarationsStr;
        tokensToReplace.RelationshipOptions = relationshipOptionsStr;
        tokensToReplace.RelationshipReturnOptions = relationshipReturnOptionsStr;

        for (const token of Object.keys(tokensToReplace)) {
            const search = "[" + token + "]";
            fileBaseStr = fileBaseStr.replaceAll(search, tokensToReplace[token]);
        }

        fs.writeFileSync(`${BASE_GEN_FILES_DIR}/${entityNameKebabCase}/${entityNameKebabCase}.controller-base.js`, fileBaseStr);
    }
    //#endregion

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

    async generateSpecialisationClasses() {
        for (const entityNameCamelCase of Object.keys(this.dataModelObj)) {
            await this.#generateSpecialisationClass("controller", entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
            await this.#generateSpecialisationClass("data-series", entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
            await this.#generateSpecialisationClass("endpoint", entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
            await this.#generateSpecialisationClass("model", entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);

            // await this.#generateSpecialisationControllerClassForEntity(entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
            // await this.#generateSpecialisationDataSeriesClassForEntity(entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
            // await this.#generateSpecialisationEndpointClassForEntity(entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
            // await this.#generateSpecialisationModelClassForEntity(entityNameCamelCase, this.dataModelObj[entityNameCamelCase]);
        }
    }

    async #generateSpecialisationClass(classType = "controller", entityNameCamelCase, entityDataModel = {}) {
        const entityNamePascalCase = dxUtils.convertCamelCaseToPascalCase(entityNameCamelCase);
        const entityNameKebabCase = dxUtils.getCamelCaseSplittedToLowerCase(entityNameCamelCase, "-");

        const packageNameKebabCase = entityDataModel.packageName  ?? this.corePackageName;
        const packageNameCamelCase = entityDataModel.packageNameCamelCase  ?? this.corePackageName;

        const tokensToReplace = {
            EntityNameCamelCase: entityNameCamelCase,
            EntityNamePascalCase: entityNamePascalCase,
            EntityNameKebabCase: entityNameKebabCase,
            PackageNameKebabCase: packageNameKebabCase,
            PackageNameCamelCase: packageNameCamelCase,
        };

        let fileSpecialisationStr = fs.readFileSync(`${GEN_TEMPLATE_DIR}/${classType}/specialisation-${classType}.tpl`, "utf-8");

        for (const token of Object.keys(tokensToReplace)) {
            const search = "[" + token + "]";
            fileSpecialisationStr = fileSpecialisationStr.replaceAll(search, tokensToReplace[token]);
        }

        const finalPath = `divblox-packages-local/${packageNameKebabCase}/${entityNameKebabCase}/${entityNameKebabCase}.${classType}.js`
        if (!fs.existsSync(finalPath)) {
            fs.writeFileSync(finalPath, fileSpecialisationStr);
            dxUtils.printSuccessMessage(`Generated ${classType} for '${entityNameCamelCase}'`);
        } else {
            dxUtils.printInfoMessage(`Skipped ${classType} for '${entityNameCamelCase}': Already exists (If you wish to regenerate it - delete the current ${entityNameKebabCase}.${classType}.js file)`);
        }
    }
}

module.exports = CodeGenerator;