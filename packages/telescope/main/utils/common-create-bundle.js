"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonBundlePlugin = void 0;
const imports_1 = require("../imports");
const path_1 = require("path");
const build_1 = require("../build");
const files_1 = require("../utils/files");
const utils_1 = require("../utils");
const proto_parser_1 = require("@cosmology/proto-parser");
const commonBundlePlugin = (builder, bundleFilename, packageMappings, astFn) => {
    const localname = bundleFilename;
    // create proto ref for context
    const pkg = '@root';
    const ref = (0, proto_parser_1.createEmptyProtoRef)(pkg, localname);
    // create context
    const pCtx = new build_1.TelescopeParseContext(ref, builder.store, builder.options);
    // generate code for createRpcQueryHooks and imports of related packages.
    const ast = astFn(pCtx.proto, packageMappings);
    // generate imports added by context.addUtil
    const imports = (0, utils_1.fixlocalpaths)((0, imports_1.aggregateImports)(pCtx, {}, localname));
    const importStmts = (0, imports_1.getImportStatements)(localname, imports, builder.options);
    // construct the AST
    const prog = [].concat(importStmts).concat(ast);
    // write the file.
    const filename = (0, path_1.join)(builder.outPath, localname);
    builder.files.push(localname);
    (0, files_1.writeAstToFile)(builder.outPath, builder.options, prog, filename);
};
exports.commonBundlePlugin = commonBundlePlugin;
