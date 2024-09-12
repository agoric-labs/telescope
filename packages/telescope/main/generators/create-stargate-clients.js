"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const path_1 = require("path");
const ast_1 = require("@cosmology/ast");
const case_1 = require("case");
const utils_1 = require("@cosmology/utils");
const imports_1 = require("../imports");
const plugin = (builder, bundler) => {
    if (!bundler.registries || !bundler.registries.length) {
        return;
    }
    const registryImports = [];
    const converterImports = [];
    const clientFile = (0, path_1.join)(`${bundler.bundle.base}`, 'client.ts');
    bundler.files.push(clientFile);
    const ctxRef = {
        absolute: '/',
        filename: '/',
        proto: {
            imports: [],
            package: bundler.bundle.base,
            root: {},
        }
    };
    const ctx = new ast_1.GenericParseContext(ctxRef, null, builder.options);
    const registryVariables = [];
    const converterVariables = [];
    bundler.registries.forEach(registry => {
        let rel = (0, path_1.relative)((0, path_1.dirname)(clientFile), registry.localname);
        if (!rel.startsWith('.'))
            rel = `./${rel}`;
        const variable = (0, utils_1.variableSlug)(registry.localname);
        registryVariables.push(variable);
        registryImports.push((0, ast_1.importNamespace)(variable, rel));
    });
    bundler.converters.forEach(converter => {
        let rel = (0, path_1.relative)((0, path_1.dirname)(clientFile), converter.localname);
        if (!rel.startsWith('.'))
            rel = `./${rel}`;
        const variable = (0, utils_1.variableSlug)(converter.localname);
        converterVariables.push(variable);
        converterImports.push((0, ast_1.importNamespace)(variable, rel));
    });
    const name = 'getSigning' + (0, case_1.pascal)(bundler.bundle.base + 'Client');
    const txRpcName = 'getSigning' + (0, case_1.pascal)(bundler.bundle.base + 'TxRpc');
    const prefix = (0, case_1.camel)(bundler.bundle.base);
    const aminos = (0, ast_1.createStargateClientAminoRegistry)({
        context: ctx,
        aminos: converterVariables,
        aminoConverters: prefix + 'AminoConverters'
    });
    const protos = (0, ast_1.createStargateClientProtoRegistry)({
        context: ctx,
        registries: registryVariables,
        protoTypeRegistry: prefix + 'ProtoRegistry'
    });
    const clientOptions = (0, ast_1.createStargateClientOptions)({
        context: ctx,
        name: name + 'Options',
        protoTypeRegistry: prefix + 'ProtoRegistry',
        aminoConverters: prefix + 'AminoConverters'
    });
    const clientBody = (0, ast_1.createStargateClient)({
        context: ctx,
        name,
        options: name + 'Options',
    });
    let getTxRpc;
    if (ctx.pluginValue("stargateClients.addGetTxRpc")) {
        getTxRpc = (0, ast_1.createGetTxRpc)(ctx, txRpcName, name);
    }
    const imports = (0, imports_1.buildAllImportsFromGenericContext)(ctx, clientFile);
    let importDecls = [...imports, ...registryImports, ...converterImports];
    importDecls = (0, utils_1.duplicateImportPathsWithExt)(importDecls, builder.options.restoreImportExtension);
    let cProg = importDecls
        .concat(aminos)
        .concat(protos)
        .concat(clientOptions)
        .concat(clientBody);
    if (getTxRpc) {
        cProg = cProg.concat(getTxRpc);
    }
    const clientOutFile = (0, path_1.join)(builder.outPath, clientFile);
    bundler.writeAst(cProg, clientOutFile);
};
exports.plugin = plugin;
