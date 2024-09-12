"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const imports_1 = require("../imports");
const proto_parser_1 = require("@cosmology/proto-parser");
const parse_1 = require("../parse");
const ast_1 = require("@cosmology/ast");
const plugin = (builder, bundler) => {
    if (!builder.options.lcdClients.enabled) {
        return;
    }
    const queryContexts = bundler
        .contexts
        .filter(context => context.queries.length > 0 ||
        context.services.length > 0);
    // [x] write out one registry helper for all contexts w/mutations
    const lcdClients = queryContexts.map(c => {
        const enabled = c.proto.pluginValue('lcdClients.enabled');
        if (!enabled)
            return;
        if (c.proto.isExcluded())
            return;
        const ctx = bundler.getFreshContext(c);
        // get mutations, services
        (0, parse_1.parse)(ctx);
        const proto = (0, proto_parser_1.getNestedProto)(c.ref.traversed);
        //// Anything except Msg Service OK...
        const allowedRpcServices = builder.options.rpcClients.enabledServices.filter(a => a !== 'Msg');
        const found = allowedRpcServices.some(svc => {
            return proto?.[svc] &&
                proto[svc]?.type === 'Service';
        });
        if (!found) {
            return;
        }
        ///
        let getImportsFrom;
        // get imports
        allowedRpcServices.forEach(svcKey => {
            if (proto[svcKey]) {
                if (svcKey === 'Query') {
                    getImportsFrom = ctx.queries;
                }
                else {
                    getImportsFrom = ctx.services;
                }
            }
        });
        const localname = bundler.getLocalFilename(c.ref, 'lcd');
        const filename = bundler.getFilename(localname);
        let ast = null;
        allowedRpcServices.forEach(svcKey => {
            if (proto[svcKey]) {
                ast = (0, ast_1.createLCDClient)(ctx.generic, proto[svcKey]);
            }
        });
        if (!ast) {
            return;
        }
        const serviceImports = (0, imports_1.getDepsFromQueries)(getImportsFrom, localname);
        const imports = (0, imports_1.buildAllImports)(ctx, serviceImports, localname);
        const prog = []
            .concat(imports)
            .concat(ctx.body)
            .concat(ast);
        bundler.writeAst(prog, filename);
        bundler.addToBundle(c, localname);
        return {
            proto: c.ref.filename,
            // TODO use this to build LCD aggregators with scopes
            package: c.ref.proto.package,
            localname,
            filename
        };
    }).filter(Boolean);
    bundler.addLCDClients(lcdClients);
};
exports.plugin = plugin;
