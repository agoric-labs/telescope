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
const plugin = (builder) => {
    // if react query is enabled
    // generate hooks.ts based on query hooks generated in each package.
    // eg: __fixtures__/output1/hooks.ts
    if (!builder.options.reactQuery.enabled) {
        return;
    }
    const localname = 'hooks.ts';
    // get mapping of packages and rpc query filenames.
    const obj = {};
    const instantHooksMapping = {};
    const methodSet = new Set();
    const bundlerFiles = builder.stateManagers["reactQuery"];
    if (!bundlerFiles || !bundlerFiles.length) {
        return;
    }
    let nameMapping = builder.options.reactQuery?.instantExport?.nameMapping;
    nameMapping = (0, utils_4.swapKeyValue)(nameMapping ?? {});
    bundlerFiles.map(bundlerFile => {
        const path = `./${bundlerFile.localname.replace(/\.ts$/, '')}`;
        dotty.put(obj, bundlerFile.package, path);
        // build instantHooksMapping
        bundlerFile.instantExportedMethods?.forEach((method) => {
            const methodName = method.name;
            const useHookName = (0, utils_2.makeUseHookName)((0, utils_2.camel)(methodName));
            const hookNameWithPkg = `${bundlerFile.package}.${useHookName}`;
            let instantHookName = null;
            if (nameMapping[hookNameWithPkg]) {
                instantHookName = nameMapping[hookNameWithPkg];
            }
            else {
                if (methodSet.has(useHookName)) {
                    instantHookName = (0, utils_2.makeUsePkgHookName)(bundlerFile.package, methodName);
                }
                else {
                    instantHookName = useHookName;
                }
            }
            dotty.put(instantHooksMapping, instantHookName, {
                useHookName,
                importedVarName: (0, utils_3.variableSlug)(path),
                comment: `${bundlerFile.package}.${useHookName}\n${method.comment ?? methodName}`
            });
            methodSet.add(instantHookName);
        });
    });
    // create proto ref for context
    const pkg = '@root';
    const ref = (0, proto_parser_1.createEmptyProtoRef)(pkg, localname);
    // create context
    const pCtx = new build_1.TelescopeParseContext(ref, builder.store, builder.options);
    // generate code for createRpcQueryHooks and imports of related packages.
    const ast = (0, ast_1.createScopedRpcHookFactory)(pCtx.proto, obj, 'createRpcQueryHooks', instantHooksMapping);
    // generate imports added by context.addUtil
    const imports = (0, utils_1.fixlocalpaths)((0, imports_1.aggregateImports)(pCtx, {}, localname));
    const importStmts = (0, imports_1.getImportStatements)(localname, imports, builder.options);
    // construct the AST
    const prog = []
        .concat(importStmts)
        .concat(ast);
    // write the file.
    const filename = (0, path_1.join)(builder.outPath, localname);
    builder.files.push(localname);
    (0, files_1.writeAstToFile)(builder.outPath, builder.options, prog, filename);
};
exports.plugin = plugin;
