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
const build_1 = require("../build");
const imports_1 = require("../imports");
const plugin = (builder, bundler) => {
    // if not enabled, exit
    if (!builder.options?.lcdClients?.enabled) {
        return;
    }
    // if no scopes, do them all!
    if (!builder.options.lcdClients.scoped ||
        !builder.options.lcdClients.scoped.length) {
        // TODO inefficient
        // WE SHOULD NOT DO THIS IN A BUNDLER LOOP
        // MAKE SEPARATE PLUGIN
        return createAllLCDBundles(builder, bundler);
    }
    if (!builder.options.lcdClients.scopedIsExclusive) {
        // TODO inefficient
        // WE SHOULD NOT DO THIS IN A BUNDLER LOOP
        // MAKE SEPARATE PLUGIN
        createAllLCDBundles(builder, bundler);
    }
    // we have scopes!
    builder.options.lcdClients.scoped.forEach(lcd => {
        if (lcd.dir !== bundler.bundle.base)
            return;
        makeLCD(builder, bundler, lcd);
    });
};
exports.plugin = plugin;
const getFileName = (dir, filename) => {
    const localname = (0, path_1.join)(dir, filename ?? 'lcd.ts');
    if (localname.endsWith('.ts'))
        return localname;
    return localname + '.ts';
};
const makeLCD = (builder, bundler, lcd) => {
    const dir = lcd.dir;
    const packages = lcd.packages;
    const protos = lcd.protos;
    const methodName = lcd.methodName ?? 'createLCDClient';
    const localname = getFileName(dir, lcd.filename);
    const obj = {};
    builder.lcdClients.forEach(file => {
        // ADD all option
        // which defaults to including cosmos
        // and defaults to base for each
        // if (!packages.includes(file.package)) {
        if (!(0, proto_parser_1.isRefIncluded)((0, proto_parser_1.createEmptyProtoRef)(file.package, file.proto), {
            packages,
            protos
        })) {
            return;
        }
        const f = localname;
        const f2 = file.localname;
        const importPath = (0, utils_1.getRelativePath)(f, f2);
        dotty.put(obj, file.package, importPath);
    });
    const ctx = new build_1.TelescopeParseContext((0, proto_parser_1.createEmptyProtoRef)(dir, localname), builder.store, builder.options);
    const lcdast = (0, ast_1.createScopedLCDFactory)(ctx.proto, obj, methodName, 'LCDQueryClient' // make option later
    );
    const imports = (0, imports_1.aggregateImports)(ctx, {}, localname);
    const importStmts = (0, imports_1.getImportStatements)(localname, [...(0, utils_1.fixlocalpaths)(imports)], builder.options);
    const prog = []
        .concat(importStmts)
        .concat(lcdast);
    const filename = bundler.getFilename(localname);
    bundler.writeAst(prog, filename);
    if (lcd.addToBundle) {
        bundler.addToBundleToPackage(`${dir}.ClientFactory`, localname);
    }
};
// TODO
/*
 move all options for lcd into previous `lcd` prop and
 clean up all these many options for one nested object full of options
*/
const createAllLCDBundles = (builder, bundler) => {
    if (!builder.options.lcdClients.bundle)
        return;
    // [x] loop through every bundle
    // [x] if not cosmos, add all cosmos
    // [x] call makeLCD
    // [x] add to bundle
    const dir = bundler.bundle.base;
    const filename = 'lcd.ts';
    ///
    ///
    ///
    // refs with services
    const refs = builder.store.getProtos().filter((ref) => {
        const proto = (0, proto_parser_1.getNestedProto)(ref.traversed);
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
    makeLCD(builder, bundler, {
        dir,
        filename,
        packages,
        addToBundle: true,
        methodName: 'createLCDClient'
    });
};
