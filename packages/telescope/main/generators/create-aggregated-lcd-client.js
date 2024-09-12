"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const imports_1 = require("../imports");
const proto_parser_1 = require("@cosmology/proto-parser");
const parse_1 = require("../parse");
const path_1 = require("path");
const ast_1 = require("@cosmology/ast");
const build_1 = require("../build");
const files_1 = require("../utils/files");
const utils_1 = require("../utils");
const plugin = (builder) => {
    if (!builder.options.aggregatedLCD) {
        return;
    }
    const opts = builder.options.aggregatedLCD;
    const { dir, filename: fname, packages, protos } = opts;
    const localname = (0, path_1.join)(dir, fname);
    const refs = builder.store.filterProtoWhere((ref) => {
        return (0, proto_parser_1.isRefIncluded)(ref, {
            packages,
            protos
        }) && !(0, proto_parser_1.isRefExcluded)(ref, builder.options.prototypes?.excluded);
    });
    const services = refs.map(ref => {
        const proto = (0, proto_parser_1.getNestedProto)(ref.traversed);
        if (!proto?.Query || proto.Query?.type !== 'Service') {
            return;
        }
        return proto.Query;
    }).filter(Boolean);
    const tc = new build_1.TelescopeParseContext(refs[0], builder.store, builder.options);
    const context = tc.proto;
    const lcdast = (0, ast_1.createAggregatedLCDClient)(context, services, 'QueryClient');
    const importsForAggregator = (0, imports_1.aggregateImports)(tc, {}, localname);
    /////////
    /////////
    /////////
    /////////
    const queryContexts = builder
        .contexts
        .filter(context => context.queries.length > 0 ||
        context.services.length > 0);
    const progImports = queryContexts.reduce((m, c) => {
        if (!(0, proto_parser_1.isRefIncluded)(c.ref, {
            packages,
            protos
        })) {
            return m;
        }
        const ctx = new build_1.TelescopeParseContext(c.ref, c.store, builder.options);
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
        const serviceImports = (0, imports_1.getDepsFromQueries)(getImportsFrom, localname);
        const imports = (0, imports_1.aggregateImports)(ctx, serviceImports, localname);
        return [...m, ...(0, utils_1.fixlocalpaths)(imports)];
    }, []);
    const importStmts = (0, imports_1.getImportStatements)(localname, [...importsForAggregator, ...progImports], builder.options);
    const prog = []
        .concat(importStmts)
        .concat(lcdast);
    const filename = (0, path_1.join)(builder.outPath, localname);
    (0, files_1.writeAstToFile)(builder.outPath, builder.options, prog, filename);
};
exports.plugin = plugin;
