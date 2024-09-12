"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const imports_1 = require("../imports");
const ast_1 = require("@cosmology/ast");
const proto_parser_1 = require("@cosmology/proto-parser");
const parse_1 = require("../parse");
const utils_1 = require("@cosmology/utils");
const plugin = (builder, bundler) => {
    // if (!builder.options.rpcClients.enabled) {
    //     return;
    // }
    const instantRpcBundlerFiles = {};
    const mutationContexts = bundler
        .contexts
        .filter(context => context.mutations.length > 0);
    const clients = mutationContexts.map(c => {
        const enabled = c.proto.pluginValue('rpcClients.enabled');
        if (!enabled)
            return;
        const inline = c.proto.pluginValue('rpcClients.inline');
        if (inline)
            return;
        if (c.proto.isExcluded())
            return;
        const useCamelCase = c.proto.pluginValue("rpcClients.camelCase");
        const localname = bundler.getLocalFilename(c.ref, 'rpc.msg');
        const filename = bundler.getFilename(localname);
        const ctx = bundler.getFreshContext(c);
        // get mutations, services
        (0, parse_1.parse)(ctx);
        const proto = (0, proto_parser_1.getNestedProto)(c.ref.traversed);
        // hard-coding, for now, only Msg service
        if (!proto?.Msg || proto.Msg?.type !== 'Service') {
            return;
        }
        ////////
        const asts = [];
        const bundlerFile = {
            proto: c.ref.filename,
            package: c.ref.proto.package,
            localname,
            filename,
            isMsg: true
        };
        switch (c.proto.pluginValue("rpcClients.type")) {
            case 'grpc-gateway':
                asts.push((0, ast_1.createGRPCGatewayMsgClass)(ctx.generic, proto.Msg));
                break;
            case 'grpc-web':
                asts.push((0, ast_1.createGrpcWebMsgInterface)(ctx.generic, proto.Msg));
                asts.push((0, ast_1.createGrpcWebMsgClass)(ctx.generic, proto.Msg));
                asts.push((0, ast_1.GetDesc)(ctx.generic, proto.Msg));
                const Desces = (0, ast_1.getMethodDesc)(ctx.generic, proto.Msg);
                for (let i = 0; i < Desces.length; i++) {
                    const element = Desces[i];
                    asts.push(element);
                }
                asts.push((0, ast_1.grpcWebRpcInterface)());
                asts.push((0, ast_1.getGrpcWebImpl)(ctx.generic));
                break;
            case 'tendermint':
            default:
                asts.push((0, ast_1.createRpcClientInterface)(ctx.generic, proto.Msg));
                const svc = proto.Msg;
                const instantOps = c.options.rpcClients?.instantOps ?? [];
                instantOps.forEach((item) => {
                    let nameMapping = {
                        ...(0, utils_1.swapKeyValue)(item.nameMapping?.All ?? {}),
                        ...(0, utils_1.swapKeyValue)(item.nameMapping?.Msg ?? {})
                    };
                    // get all query methods
                    const patterns = item.include?.patterns;
                    const serviceTypes = item.include?.serviceTypes;
                    if (serviceTypes && !serviceTypes.includes("Tx")) {
                        return;
                    }
                    const methodKeys = (0, utils_1.getQueryMethodNames)(bundlerFile.package, Object.keys(svc.methods ?? {}), patterns, useCamelCase ? utils_1.camel : String);
                    if (!methodKeys || !methodKeys.length) {
                        return;
                    }
                    asts.push((0, ast_1.createRpcClientInterface)(ctx.generic, svc, item.className, methodKeys, nameMapping));
                    bundlerFile.instantExportedMethods = methodKeys.map((key) => svc.methods[key]);
                    if (!instantRpcBundlerFiles[item.className]) {
                        instantRpcBundlerFiles[item.className] = [];
                    }
                    instantRpcBundlerFiles[item.className].push({ ...bundlerFile });
                });
                asts.push((0, ast_1.createRpcClientClass)(ctx.generic, proto.Msg));
                const env = c.proto.pluginValue('env');
                if (env === 'v-next') {
                    asts.push((0, ast_1.createRpcClientImpl)(ctx.generic, svc));
                }
        }
        ////////
        const serviceImports = (0, imports_1.getDepsFromQueries)(ctx.mutations, localname);
        // TODO we do NOT need all imports...
        const imports = (0, imports_1.buildAllImports)(ctx, serviceImports, localname);
        const prog = []
            .concat(imports)
            .concat(ctx.body)
            .concat(asts);
        bundler.writeAst(prog, filename);
        bundler.addToBundle(c, localname);
        return {
            package: c.ref.proto.package,
            localname,
            filename
        };
    }).filter(Boolean);
    bundler.addRPCMsgClients(clients);
    Object.keys(instantRpcBundlerFiles).forEach((className) => {
        bundler.addStateManagers(`instantRpc_${className}`, instantRpcBundlerFiles[className]);
    });
};
exports.plugin = plugin;
