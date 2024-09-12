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
const t = __importStar(require("@babel/types"));
const imports_1 = require("../imports");
const parse_1 = require("../parse");
const fs_1 = require("fs");
const path_1 = require("path");
const mkdirp_1 = require("mkdirp");
const proto_parser_1 = require("@cosmology/proto-parser");
const ast_1 = require("@cosmology/ast");
const utils_1 = require("@cosmology/utils");
const plugin = (builder, bundler) => {
    const instantRpcBundlerFiles = {};
    // [x] search for all files that live in package
    const baseProtos = builder.store.getProtos().filter(ref => {
        return ref.proto.package.split('.')[0] === bundler.bundle.base;
    });
    // [x] write out all TS files for package
    bundler.contexts = baseProtos.map(ref => {
        const context = builder.context(ref);
        (0, parse_1.parse)(context);
        context.buildBase();
        //// Anything except Msg Service OK...
        const allowedRpcServices = builder.options.rpcClients.enabledServices.filter(a => a !== 'Msg');
        const localname = bundler.getLocalFilename(ref);
        const filename = bundler.getFilename(localname);
        const bundlerFile = {
            proto: context.ref.filename,
            package: context.ref.proto.package,
            localname,
            filename
        };
        if (context.proto.pluginValue('rpcClients.inline')) {
            const proto = (0, proto_parser_1.getNestedProto)(context.ref.traversed);
            const instantOps = context.options.rpcClients?.instantOps ?? [];
            const useCamelCase = context.options.rpcClients?.camelCase;
            allowedRpcServices.forEach(svcKey => {
                if (proto[svcKey]) {
                    const svc = proto[svcKey];
                    context.body.push((0, ast_1.createRpcClientInterface)(context.generic, proto[svcKey]));
                    instantOps.forEach((item) => {
                        let nameMapping = {
                            ...(0, utils_1.swapKeyValue)(item.nameMapping?.All ?? {}),
                            ...(0, utils_1.swapKeyValue)(item.nameMapping?.Query ?? {})
                        };
                        // get all query methods
                        const patterns = item.include?.patterns;
                        const serviceTypes = item.include?.serviceTypes;
                        if (serviceTypes && !serviceTypes.includes("Query")) {
                            return;
                        }
                        const methodKeys = (0, utils_1.getQueryMethodNames)(bundlerFile.package, Object.keys(proto[svcKey].methods ?? {}), patterns, useCamelCase ? utils_1.camel : String);
                        if (!methodKeys || !methodKeys.length) {
                            return;
                        }
                        context.body.push((0, ast_1.createRpcClientInterface)(context.generic, svc, item.className, methodKeys, nameMapping));
                        bundlerFile.instantExportedMethods = methodKeys.map((key) => proto[svcKey].methods[key]);
                        if (!instantRpcBundlerFiles[item.className]) {
                            instantRpcBundlerFiles[item.className] = [];
                        }
                        instantRpcBundlerFiles[item.className].push({ ...bundlerFile });
                    });
                    context.body.push((0, ast_1.createRpcClientClass)(context.generic, proto[svcKey]));
                    if (context.proto.pluginValue('rpcClients.extensions')) {
                        context.body.push((0, ast_1.createRpcQueryExtension)(context.generic, proto[svcKey]));
                    }
                    else {
                        const env = context.proto.pluginValue('env');
                        if (env === 'v-next') {
                            context.body.push((0, ast_1.createRpcClientImpl)(context.generic, proto[svcKey]));
                        }
                    }
                }
            });
            if (proto.Msg) {
                bundlerFile.isMsg = true;
                context.body.push((0, ast_1.createRpcClientInterface)(context.generic, proto.Msg));
                instantOps.forEach((item) => {
                    let nameMapping = {
                        ...(0, utils_1.swapKeyValue)(item.nameMapping?.All ?? {}),
                        ...(0, utils_1.swapKeyValue)(item.nameMapping?.Msg ?? {})
                    };
                    // get all msg methods
                    const patterns = item.include?.patterns;
                    const serviceTypes = item.include?.serviceTypes;
                    if (serviceTypes && !serviceTypes.includes("Tx")) {
                        return;
                    }
                    const methodKeys = (0, utils_1.getQueryMethodNames)(bundlerFile.package, Object.keys(proto.Msg.methods ?? {}), patterns, useCamelCase ? utils_1.camel : String);
                    if (!methodKeys || !methodKeys.length) {
                        return;
                    }
                    context.body.push((0, ast_1.createRpcClientInterface)(context.generic, proto.Msg, item.className, methodKeys, nameMapping));
                    bundlerFile.instantExportedMethods = methodKeys.map((key) => proto['Msg'].methods[key]);
                    if (!instantRpcBundlerFiles[item.className]) {
                        instantRpcBundlerFiles[item.className] = [];
                    }
                    instantRpcBundlerFiles[item.className].push({ ...bundlerFile });
                });
                context.body.push((0, ast_1.createRpcClientClass)(context.generic, proto.Msg));
                const env = context.proto.pluginValue('env');
                if (env === 'v-next') {
                    context.body.push((0, ast_1.createRpcClientImpl)(context.generic, proto.Msg));
                }
            }
        }
        // build BASE file
        const importStmts = (0, imports_1.buildAllImports)(context, null, context.ref.filename);
        const prog = []
            .concat(importStmts);
        // package var
        if (context.proto.pluginValue('prototypes.includePackageVar')) {
            prog.push(t.exportNamedDeclaration(t.variableDeclaration('const', [
                t.variableDeclarator(t.identifier('protobufPackage'), t.stringLiteral(context.ref.proto.package))
            ])));
        }
        // body
        prog.push.apply(prog, context.body);
        if (context.body.length > 0) {
            bundler.writeAst(prog, filename);
        }
        else {
            mkdirp_1.mkdirp.sync((0, path_1.dirname)(filename));
            (0, fs_1.writeFileSync)(filename, `export {}`);
        }
        return context;
    }).filter(Boolean);
    Object.keys(instantRpcBundlerFiles).forEach((className) => {
        bundler.addStateManagers(`instantRpc_${className}`, instantRpcBundlerFiles[className]);
    });
};
exports.plugin = plugin;
