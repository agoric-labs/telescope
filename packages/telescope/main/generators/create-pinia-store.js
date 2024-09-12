"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const imports_1 = require("../imports");
const parse_1 = require("../parse");
const proto_parser_1 = require("@cosmology/proto-parser");
const ast_1 = require("@cosmology/ast");
const plugin = (builder, bundler) => {
    if (!builder.options.pinia?.enabled) {
        return;
    }
    // get mapping of packages and rpc query filenames.
    if (!builder.options.lcdClients?.enabled) {
        return;
    }
    const queryContexts = bundler.contexts.filter((context) => context.queries.length > 0 || context.services.length > 0);
    if (queryContexts.length > 0) {
        const piniaBundlerFiles = [];
        // [x] write out one registry helper for all contexts w/mutations
        queryContexts.forEach((c) => {
            const enabled = c.proto.pluginValue('lcdClients.enabled');
            if (!enabled)
                return;
            const includePinia = c.proto.pluginValue('pinia.enabled') &&
                (0, proto_parser_1.isRefIncluded)(c.ref, c.proto.pluginValue('pinia.include'));
            if (!includePinia)
                return;
            if (c.proto.isExcluded())
                return;
            const ctx = bundler.getFreshContext(c);
            // get mutations, services
            (0, parse_1.parse)(ctx);
            const proto = (0, proto_parser_1.getNestedProto)(c.ref.traversed);
            //// Anything except Msg Service OK...
            const allowedRpcServices = builder.options.rpcClients.enabledServices.filter((a) => a !== 'Msg');
            let name, getImportsFrom;
            // get imports
            allowedRpcServices.forEach((svcKey) => {
                if (proto[svcKey]) {
                    if (svcKey === 'Query') {
                        getImportsFrom = ctx.queries;
                    }
                    else {
                        getImportsFrom = ctx.services;
                    }
                    name = svcKey;
                }
            });
            const localname = bundler.getLocalFilename(c.ref, 'pinia.store');
            const filename = bundler.getFilename(localname);
            const bundlerFile = {
                package: c.ref.proto.package,
                localname,
                filename
            };
            let ast = null;
            allowedRpcServices.forEach((svcKey) => {
                if (proto[svcKey]) {
                    ast = (0, ast_1.createPiniaStore)(ctx.generic, proto[svcKey]);
                }
            });
            if (!ast) {
                return;
            }
            piniaBundlerFiles.push(bundlerFile);
            const serviceImports = (0, imports_1.getDepsFromQueries)(getImportsFrom, localname);
            const imports = (0, imports_1.buildAllImports)(ctx, serviceImports, localname);
            const piniaImport = (0, imports_1.getImportStatements)('pinia', [
                {
                    type: 'import',
                    name: 'defineStore',
                    path: 'pinia'
                },
                {
                    type: 'import',
                    name: 'LCDQueryClient',
                    path: './query.lcd'
                }
            ], builder.options);
            const prog = []
                .concat([...imports, ...piniaImport])
                .concat(ctx.body)
                .concat(ast);
            bundler.writeAst(prog, filename);
            bundler.addToBundle(c, localname);
        });
        bundler.addStateManagers('pinia', piniaBundlerFiles);
    }
};
exports.plugin = plugin;
