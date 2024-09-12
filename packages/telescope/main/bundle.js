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
exports.createFileBundle = exports.parsePackage = exports.parseContextsForRegistry = exports.bundleBaseRegistries = exports.bundleRegistries = exports.bundlePackages = exports.getPackagesBundled = exports.getPackages = void 0;
const proto_parser_1 = require("@cosmology/proto-parser");
const ast_1 = require("@cosmology/ast");
const dotty = __importStar(require("dotty"));
const path_1 = require("path");
// TODO move to store
const getPackages = (store) => {
    return store.getProtos().reduce((m, proto) => {
        if (proto.proto.package) {
            m[proto.proto.package] = m[proto.proto.package] || [];
            m[proto.proto.package].push(proto);
        }
        return m;
    }, {});
};
exports.getPackages = getPackages;
const getPackagesBundled = (store) => {
    const objectified = {};
    const pkgs = (0, exports.getPackages)(store);
    Object.keys(pkgs).forEach(key => {
        if ((0, proto_parser_1.isRefExcluded)((0, proto_parser_1.createEmptyProtoRef)(key), store.options.prototypes?.excluded))
            return;
        const files = pkgs[key];
        dotty.put(objectified, key, {
            pkg: key,
            files: files.filter(file => {
                return !(0, proto_parser_1.isRefExcluded)((0, proto_parser_1.createEmptyProtoRef)(key, file.filename), store.options.prototypes?.excluded);
            })
        });
    });
    return objectified;
};
exports.getPackagesBundled = getPackagesBundled;
const bundlePackages = (store) => {
    const allPackages = (0, exports.getPackagesBundled)(store);
    return Object.keys(allPackages).map(base => {
        const pkgs = allPackages[base];
        const bundleVariables = {};
        const bundleFile = (0, path_1.join)(base, 'bundle.ts');
        const importPaths = [];
        (0, exports.parsePackage)(store.options, pkgs, bundleFile, importPaths, bundleVariables);
        return {
            bundleVariables,
            bundleFile,
            importPaths,
            base
        };
    });
};
exports.bundlePackages = bundlePackages;
// TODO review bundle registry methods
const bundleRegistries = (telescope) => {
    const withMutations = telescope.contexts.filter(ctx => ctx.mutations.length);
    const obj = withMutations.reduce((m, ctx) => {
        m[ctx.ref.proto.package] = m[ctx.ref.proto.package] ?? [];
        m[ctx.ref.proto.package].push(ctx);
        return m;
    }, {});
    return Object.entries(obj)
        .map(([pkg, serviceProtos]) => {
        return {
            package: pkg,
            contexts: serviceProtos
        };
    });
};
exports.bundleRegistries = bundleRegistries;
const bundleBaseRegistries = (telescope) => {
    const withMutations = telescope.contexts.filter(ctx => ctx.mutations.length);
    const obj = withMutations.reduce((m, ctx) => {
        const base = ctx.ref.proto.package.split('.')[0];
        m[base] = m[base] ?? {};
        m[base][ctx.ref.proto.package] = m[base][ctx.ref.proto.package] ?? [];
        m[base][ctx.ref.proto.package].push(ctx);
        return m;
    }, {});
    return Object.entries(obj)
        .map(([pkg, withServices]) => {
        const serviceProtos = Object.entries(withServices)
            .map(([pkg, withServices]) => {
            return {
                package: pkg,
                contexts: withServices
            };
        });
        return {
            base: pkg,
            pkgs: serviceProtos
        };
    });
};
exports.bundleBaseRegistries = bundleBaseRegistries;
const parseContextsForRegistry = (contexts) => {
    return contexts.map((ctx) => {
        const responses = ctx.mutations.map(m => m.response);
        const imports = ctx.mutations.reduce((m, msg) => {
            m[msg.messageImport] = m[msg.messageImport] ?? [];
            m[msg.messageImport].push(msg.message);
            return m;
        }, {});
        return {
            filename: ctx.ref.filename,
            imports,
            objects: ctx.types
                .filter(type => !type.isNested)
                .filter(type => !responses.includes(type.name))
                .map(type => type.name)
        };
    });
};
exports.parseContextsForRegistry = parseContextsForRegistry;
const parsePackage = (options, obj, bundleFile, importPaths, bundleVariables) => {
    if (!obj)
        return;
    if (obj.pkg && obj.files) {
        obj.files.forEach(file => {
            (0, exports.createFileBundle)(options, obj.pkg, file.filename, bundleFile, importPaths, bundleVariables);
        });
        return;
    }
    Object.keys(obj).forEach(mini => {
        (0, exports.parsePackage)(options, obj[mini], bundleFile, importPaths, bundleVariables);
    });
};
exports.parsePackage = parsePackage;
let counter = 0;
const createFileBundle = (options, pkg, filename, bundleFile, importPaths, bundleVariables) => {
    let rel = (0, path_1.relative)((0, path_1.dirname)(bundleFile), filename);
    if (!rel.startsWith('.'))
        rel = `./${rel}`;
    const variable = `_${counter++}`;
    importPaths.push((0, ast_1.importNamespace)(variable, rel));
    dotty.put(bundleVariables, pkg + '.__export', true);
    dotty.put(bundleVariables, pkg + '.' + variable, true);
};
exports.createFileBundle = createFileBundle;
