"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const imports_1 = require("../imports");
const path_1 = require("path");
const ast_1 = require("@cosmology/ast");
const build_1 = require("../build");
const files_1 = require("../utils/files");
const utils_1 = require("../utils");
const dotty = __importStar(require("dotty"));
const proto_parser_1 = require("@cosmology/proto-parser");
const utils_2 = require("@cosmology/utils");
const utils_3 = require("@cosmology/utils");
const utils_4 = require("@cosmology/utils");
const utils_5 = require("@cosmology/utils");
const plugin = (builder) => {
    if (!builder.options.rpcClients?.enabled ||
        !builder.options.rpcClients?.instantOps?.length) {
        return;
    }
    const localname = "service-ops.ts";
    // get mapping of packages and rpc query filenames.
    // create proto ref for context
    const pkg = "@root";
    const ref = (0, proto_parser_1.createEmptyProtoRef)(pkg, localname);
    // create context
    const context = new build_1.TelescopeParseContext(ref, builder.store, builder.options);
    const pkgImports = [];
    const ast = builder.options.rpcClients.instantOps.reduce((ast, instantOpsConfig) => {
        const bundlerFiles = builder.stateManagers[`instantRpc_${instantOpsConfig.className}`];
        if (!bundlerFiles || !bundlerFiles.length) {
            return ast;
        }
        let nameMapping = instantOpsConfig.nameMapping;
        return ast.concat(createRpcOpsAst(context, instantOpsConfig.className, pkgImports, nameMapping, bundlerFiles));
    }, []);
    // generate imports added by context.addUtil
    const imports = (0, utils_1.fixlocalpaths)((0, imports_1.aggregateImports)(context, {}, localname));
    const importStmts = (0, imports_1.getImportStatements)(localname, imports, builder.options);
    // construct the AST
    const prog = [].concat(importStmts).concat((0, utils_5.buildImports)(pkgImports)).concat(ast);
    // write the file.
    const filename = (0, path_1.join)(builder.outPath, localname);
    builder.files.push(localname);
    (0, files_1.writeAstToFile)(builder.outPath, builder.options, prog, filename);
};
exports.plugin = plugin;
// bundlerFiles.filter(file => file.localname.indexOf("rpc.msg") !== -1)
function createRpcOpsAst(context, className, pkgImports, nameMapping, bundlerFiles) {
    const extendInterfaces = [];
    const instantMapping = {};
    const camelRpcMethods = context.generic.pluginValue("rpcClients.camelCase");
    let txNameMapping = {
        ...(0, utils_4.swapKeyValue)(nameMapping?.All ?? {}),
        ...(0, utils_4.swapKeyValue)(nameMapping?.Msg ?? {})
    };
    let queryNameMapping = {
        ...(0, utils_4.swapKeyValue)(nameMapping?.All ?? {}),
        ...(0, utils_4.swapKeyValue)(nameMapping?.Query ?? {})
    };
    bundlerFiles.forEach((bundlerFile) => {
        const isMsg = bundlerFile.isMsg;
        const currentNameMapping = isMsg ? txNameMapping : queryNameMapping;
        const path = `./${bundlerFile.localname.replace(/\.ts$/, "")}`;
        const importedVarName = (0, utils_3.variableSlug)(path);
        if (pkgImports &&
            !pkgImports.some((item) => item.importedAs === importedVarName)) {
            pkgImports.push({
                type: "typeImport",
                name: importedVarName,
                import: path,
                importedAs: importedVarName,
            });
        }
        extendInterfaces.push({
            importedVarName: importedVarName,
            interfaceName: className,
        });
        bundlerFile.instantExportedMethods?.forEach((method) => {
            const methodName = camelRpcMethods ? (0, utils_2.camel)(method.name) : method.name;
            const nameWithPkg = `${bundlerFile.package}.${methodName}`;
            const methodAlias = currentNameMapping && currentNameMapping[nameWithPkg]
                ? currentNameMapping[nameWithPkg]
                : methodName;
            dotty.put(instantMapping, methodAlias, {
                methodName,
                importedVarName,
                isMsg
            });
        });
    });
    return [
        (0, ast_1.createInstantRpcInterface)(className, extendInterfaces),
        (0, ast_1.createInstantRpcClass)(context.generic, className, instantMapping),
    ];
}
