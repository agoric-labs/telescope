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
const dotty = __importStar(require("dotty"));
const proto_parser_1 = require("@cosmology/proto-parser");
const path_1 = require("path");
const ast_1 = require("@cosmology/ast");
const utils_1 = require("../utils");
const imports_1 = require("../imports");
const build_1 = require("../build");
const case_1 = require("case");
const plugin = (builder, bundler) => {
    // if not enabled, exit
    if (!builder.options?.rpcClients?.enabled) {
        return;
    }
    if (builder.options?.rpcClients?.inline) {
        return;
    }
    // if no scopes, do them all!
    if (!builder.options.rpcClients.scoped ||
        !builder.options.rpcClients.scoped.length) {
        // TODO inefficient
        // WE SHOULD NOT DO THIS IN A BUNDLER LOOP
        // MAKE SEPARATE PLUGIN
        return makeAllRPCBundles(builder, bundler);
    }
    if (!builder.options.rpcClients.scopedIsExclusive) {
        // TODO inefficient
        // WE SHOULD NOT DO THIS IN A BUNDLER LOOP
        // MAKE SEPARATE PLUGIN
        makeAllRPCBundles(builder, bundler);
    }
    // we have scopes!
    builder.options.rpcClients.scoped.forEach(rpc => {
        if (rpc.dir !== bundler.bundle.base)
            return;
        makeRPC(builder, bundler, rpc);
    });
};
exports.plugin = plugin;
const getFileName = (dir, filename) => {
    filename = filename.replace(/\.ts$/, '');
    const localname = (0, path_1.join)(dir, filename + '.tx');
    return localname + '.ts';
};
const makeRPC = (builder, bundler, rpc) => {
    const dir = rpc.dir;
    const packages = rpc.packages;
    const methodName = rpc.methodNameTx ?? 'createRPCMsgClient';
    const localname = getFileName(dir, rpc.filename ?? 'rpc');
    const obj = {};
    builder.rpcMsgClients.forEach(file => {
        // ADD all option
        // which defaults to including cosmos
        // and defaults to base for each
        if (!packages.includes(file.package)) {
            return;
        }
        const f = localname;
        const f2 = file.localname;
        const importPath = (0, utils_1.getRelativePath)(f, f2);
        dotty.put(obj, file.package, importPath);
    });
    const ctx = new build_1.TelescopeParseContext((0, proto_parser_1.createEmptyProtoRef)(dir, localname), builder.store, builder.options);
    let rpcast;
    let msgExt = [];
    let txRpcImport = [];
    switch (builder.options?.rpcClients?.type) {
        case "grpc-gateway":
        // TODO no working scoped clients for grpc-gateway right now
        case "tendermint":
            // TODO add addUtil to generic context
            ctx.proto.addUtil('Rpc');
            rpcast = (0, ast_1.createScopedRpcFactory)(obj, methodName, 'MsgClientImpl', // make option later,
            ctx.options);
            if (rpc.isAll && ctx.proto.pluginValue('env') === 'v-next' && ctx.proto.pluginValue('rpcClients.extensions') && ctx.proto.pluginValue('stargateClients.addGetTxRpc')) {
                const txRpcName = 'getSigning' + (0, case_1.pascal)(bundler.bundle.base + 'TxRpc');
                txRpcImport = (0, ast_1.importStmt)([txRpcName], `./client${ctx.options.restoreImportExtension ?? ""}`);
                msgExt = (0, ast_1.createRpcMsgExtension)(ctx.proto, txRpcName);
            }
            break;
        case "grpc-web":
            ctx.proto.addUtil('grpc');
            ctx.proto.addUtil('NodeHttpTransport');
            rpcast = (0, ast_1.createScopedGrpcWebMsgFactory)(obj, methodName, 'MsgClientImpl', // make option later,
            ctx.options);
            break;
        default:
            break;
    }
    const serviceImports = (0, imports_1.getDepsFromQueries)(ctx.queries, localname);
    const imports = (0, imports_1.aggregateImports)(ctx, serviceImports, localname);
    const importStmts = (0, imports_1.getImportStatements)(localname, [...(0, utils_1.fixlocalpaths)(imports)], builder.options);
    const prog = []
        .concat(txRpcImport)
        .concat(importStmts)
        .concat(rpcast)
        .concat(msgExt);
    const filename = bundler.getFilename(localname);
    bundler.writeAst(prog, filename);
    if (rpc.addToBundle) {
        bundler.addToBundleToPackage(`${dir}.ClientFactory`, localname);
    }
};
// TODO
/*
 move all options for rpc into previous `rpc` prop and
 clean up all these many options for one nested object full of options
*/
const makeAllRPCBundles = (builder, bundler) => {
    if (!builder.options.rpcClients.bundle)
        return;
    // [x] loop through every bundle
    // [x] if not cosmos, add all cosmos
    // [x] call makeRPC
    const dir = bundler.bundle.base;
    const filename = 'rpc';
    ///
    ///
    ///
    // refs with services
    const refs = builder.store.getProtos().filter((ref) => {
        const proto = (0, proto_parser_1.getNestedProto)(ref.traversed);
        if (!proto?.Msg || proto.Msg?.type !== 'Service') {
            return;
        }
        return true;
    });
    const check = refs.filter((ref) => {
        const [base] = ref.proto.package.split('.');
        return base === bundler.bundle.base;
    });
    if (!check.length) {
        // if there are no services
        // exit the plugin
        return;
    }
    const packages = refs.reduce((m, ref) => {
        const [base] = ref.proto.package.split('.');
        if (base === 'cosmos' || base === bundler.bundle.base)
            return [...new Set([...m, ref.proto.package])];
        return m;
    }, []);
    makeRPC(builder, bundler, {
        dir,
        filename,
        packages,
        addToBundle: true,
        methodNameTx: 'createRPCMsgClient',
        isAll: true
    });
};
