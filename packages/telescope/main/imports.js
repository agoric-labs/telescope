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
exports.getDepsFromQueries = exports.getDepsFromMutations = exports.getImportsFromQueries = exports.getImportsFromMutations = exports.aggregateImports = exports.buildAllImportsFromGenericContext = exports.buildAllImports = exports.getImportStatements = void 0;
const t = __importStar(require("@babel/types"));
const ast_1 = require("@cosmology/ast");
const utils_1 = require("./utils");
const utils_2 = require("@cosmology/utils");
const importHashToArray = (hash) => {
    return Object.entries(hash ?? {}).reduce((m, [path, names]) => {
        names.forEach((name) => {
            m.push({
                type: "import",
                name,
                path,
            });
        });
        return m;
    }, []);
};
const getProtoImports = (context, filename) => {
    return context.proto.imports
        .map((usage) => {
        if (filename === usage.import)
            return;
        const importPath = (0, utils_1.getRelativePath)(filename, usage.import);
        return {
            type: "import",
            name: usage.name,
            importAs: usage.importedAs,
            path: importPath,
        };
    })
        .filter(Boolean);
};
const getAminoImports = (context, filename) => {
    return context.amino.imports
        .map((usage) => {
        if (filename === usage.import)
            return;
        const importPath = (0, utils_1.getRelativePath)(filename, usage.import);
        return {
            type: "import",
            name: usage.name,
            importAs: usage.importedAs,
            path: importPath,
        };
    })
        .filter(Boolean);
};
const getGenericImports = (context, filename) => {
    return context.generic.imports
        .map((usage) => {
        if (filename === usage.import)
            return;
        const importPath = (0, utils_1.getRelativePath)(filename, usage.import);
        return {
            type: "import",
            name: usage.name,
            importAs: usage.importedAs,
            path: importPath,
        };
    })
        .filter(Boolean);
};
const getParsedImports = (context, parsedImports, filename) => {
    const imports = [];
    Object.entries(parsedImports ?? {}).forEach(([path, names]) => {
        if (filename === path)
            return;
        const importPath = (0, utils_1.getRelativePath)(filename, path);
        const aliases = context.ref?.traversed?.importNames?.[path];
        names.forEach((name) => {
            let importAs = name;
            if (aliases && aliases[name]) {
                importAs = aliases[name];
            }
            imports.push({
                type: "import",
                name,
                importAs,
                path: importPath,
            });
        });
    });
    return imports;
};
const importAs = (name, importAs, importPath) => {
    return t.importDeclaration([t.importSpecifier(t.identifier(importAs), t.identifier(name))], t.stringLiteral(importPath));
};
// __helpers__
const getImportStatements = (filepath, list, options) => {
    const imports = list.reduce((m, obj) => {
        let editedPath = utils_1.UTIL_HELPERS.includes(obj.path)
            ? (0, utils_1.getRelativePath)(filepath, `./${obj.path.replace(/__/g, "")}`)
            : obj.path;
        editedPath = (0, utils_2.restoreExtension)(editedPath, options?.restoreImportExtension);
        const clonedObj = { ...obj, path: editedPath };
        m[clonedObj.path] = m[clonedObj.path] || [];
        const exists = m[clonedObj.path].find((el) => el.type === clonedObj.type &&
            el.path === clonedObj.path &&
            el.name === clonedObj.name);
        // MARKED AS NOT DRY [google.protobuf names]
        // TODO some have google.protobuf.Any shows up... figure out the better way to handle this
        if (/\./.test(clonedObj.name)) {
            clonedObj.name =
                clonedObj.name.split(".")[clonedObj.name.split(".").length - 1];
        }
        if (!exists) {
            m[clonedObj.path].push(clonedObj);
        }
        return m;
    }, {});
    return Object.entries(imports).reduce((m, [importPath, imports]) => {
        const defaultImports = imports.filter((a) => a.type === "default");
        if (defaultImports.length) {
            if (defaultImports.length > 1)
                throw new Error("more than one default name NOT allowed.");
            m.push(t.importDeclaration([t.importDefaultSpecifier(t.identifier(defaultImports[0].name))], t.stringLiteral(defaultImports[0].path)));
        }
        const namedImports = imports.filter((a) => a.type === "import" && (!a.importAs || a.name === a.importAs));
        if (namedImports.length) {
            m.push((0, ast_1.importStmt)(namedImports.map((i) => i.name), namedImports[0].path));
        }
        const aliasNamedImports = imports.filter((a) => a.type === "import" && a.importAs && a.name !== a.importAs);
        aliasNamedImports.forEach((imp) => {
            m.push(importAs(imp.name, imp.importAs, imp.path));
        });
        const namespaced = imports.filter((a) => a.type === "namespace");
        if (namespaced.length) {
            if (namespaced.length > 1)
                throw new Error("more than one namespaced name NOT allowed.");
            m.push(t.importDeclaration([t.importNamespaceSpecifier(t.identifier(namespaced[0].name))], t.stringLiteral(namespaced[0].path)));
        }
        return m;
    }, []);
};
exports.getImportStatements = getImportStatements;
const convertUtilsToImports = (context) => {
    const list = [];
    const utils = Object.keys({
        ...context.amino.utils,
        ...context.proto.utils,
        ...context.generic.utils,
    });
    utils.forEach((util) => {
        if (!utils_1.UTILS.hasOwnProperty(util))
            throw new Error("missing Util! ::" + util);
        if (typeof utils_1.UTILS[util] === "string") {
            list.push({
                type: "import",
                path: utils_1.UTILS[util],
                name: util,
            });
        }
        else {
            list.push(utils_1.UTILS[util]);
        }
    });
    return list;
};
const convertUtilsToImportsGenric = (context) => {
    const list = [];
    const utils = Object.keys({
        ...context.utils,
    });
    // MARKED AS NOT DRY - duplicate of above
    utils.forEach((util) => {
        if (!utils_1.UTILS.hasOwnProperty(util))
            throw new Error("missing Util! ::" + util);
        if (typeof utils_1.UTILS[util] === "string") {
            list.push({
                type: "import",
                path: utils_1.UTILS[util],
                name: util,
            });
        }
        else {
            list.push(utils_1.UTILS[util]);
        }
    });
    return list;
};
const buildAllImports = (context, allImports, filepath) => {
    const imports = (0, exports.aggregateImports)(context, allImports, filepath);
    const importStmts = (0, exports.getImportStatements)(filepath, imports, {
        restoreImportExtension: context.options.restoreImportExtension,
    });
    return importStmts;
};
exports.buildAllImports = buildAllImports;
const buildAllImportsFromGenericContext = (context, filepath) => {
    const imports = convertUtilsToImportsGenric(context);
    const importStmts = (0, exports.getImportStatements)(filepath, imports, {
        restoreImportExtension: context.options.restoreImportExtension,
    });
    return importStmts;
};
exports.buildAllImportsFromGenericContext = buildAllImportsFromGenericContext;
const addDerivativeTypesToImports = (context, imports) => {
    const ref = context.ref;
    return imports.reduce((m, obj) => {
        // SDKType
        // probably wont need this until we start generating osmonauts/helpers inline
        if (obj.type === "import" && obj.path.startsWith(".")) {
            let lookup = null;
            try {
                lookup = context.store.getImportFromRef(ref, obj.name);
            }
            catch (e) { }
            const appendSuffix = (obj, baseType) => {
                return {
                    ...obj,
                    orig: obj.name,
                    name: ast_1.SymbolNames[baseType](obj.name),
                    importAs: ast_1.SymbolNames[baseType](obj.importAs ?? obj.name),
                };
            };
            // MARKED AS NOT DRY [google.protobuf names]
            // TODO some have google.protobuf.Any shows up... figure out the better way to handle this
            const removeProtoPrefix = (obj) => {
                if (/\./.test(obj.name)) {
                    obj.name = obj.name.split(".")[obj.name.split(".").length - 1];
                    obj.importAs =
                        obj.importAs.split(".")[obj.importAs.split(".").length - 1];
                }
                return obj;
            };
            const SDKTypeObject = removeProtoPrefix(appendSuffix(obj, "SDKType"));
            const AminoTypeObject = removeProtoPrefix(appendSuffix(obj, "Amino"));
            const EncodedTypeObject = removeProtoPrefix(appendSuffix(obj, "ProtoMsg"));
            // const AminoTypeUrlObject = removeProtoPrefix(appendSuffix(obj, 'AminoType'));
            if (lookup && ["Type", "Enum"].includes(lookup.obj.type)) {
                const arr = [...m, obj];
                if (context.options.aminoEncoding?.enabled &&
                    !context.options.aminoEncoding.useLegacyInlineEncoding) {
                    // check and see if this derived import has been required...
                    const foundEnc = context.proto.derivedImports.find((a) => {
                        if (a.type !== "ProtoMsg")
                            return false;
                        if (EncodedTypeObject.orig === a.symbol.symbolName) {
                            // UNTIL you fix the ImportObjs to have ref...
                            let rel = (0, utils_1.getRelativePath)(a.symbol.ref, a.symbol.source);
                            if (rel === EncodedTypeObject.path) {
                                return true;
                            }
                        }
                    });
                    const foundAmino = context.proto.derivedImports.find((a) => {
                        if (a.type !== "Amino")
                            return false;
                        if (AminoTypeObject.orig === a.symbol.symbolName &&
                            a.symbol.ref &&
                            a.symbol.source) {
                            // UNTIL you fix the ImportObjs to have ref...
                            let rel = (0, utils_1.getRelativePath)(a.symbol.ref, a.symbol.source);
                            if (rel === AminoTypeObject.path) {
                                return true;
                            }
                        }
                    });
                    // we need Any types as defaults...
                    if (foundEnc || EncodedTypeObject.orig === "Any") {
                        arr.push(EncodedTypeObject);
                    }
                    if (foundAmino || AminoTypeObject.orig === "Any") {
                        arr.push(AminoTypeObject);
                    }
                }
                if (context.options.useSDKTypes) {
                    // issue in output1 (probably legacy v1 amino transpiler)
                    // ProposalSDKType wasn't being found in QueryProposalResponseSDKType
                    arr.push(SDKTypeObject);
                    // const foundSDK = context.proto.derivedImports.find(a => {
                    //     if (a.type !== 'SDKType') return false;
                    //     if (SDKTypeObject.orig === a.symbol.symbolName) {
                    //         // UNTIL you fix the ImportObjs to have ref...
                    //         let rel = getRelativePath(a.symbol.ref, a.symbol.source);
                    //         if (rel === SDKTypeObject.path) {
                    //             return true;
                    //         }
                    //     }
                    // });
                    // if (foundSDK) {
                    //     arr.push(SDKTypeObject);
                    // }
                }
                return arr;
            }
        }
        return [...m, obj];
    }, []);
};
const aggregateImports = (context, allImports, filepath) => {
    const protoImports = getProtoImports(context, filepath);
    const aminoImports = getAminoImports(context, filepath);
    const genericImports = getGenericImports(context, filepath);
    const parsedImports = getParsedImports(context, context.amino.ref.traversed.parsedImports, filepath);
    const additionalImports = importHashToArray(allImports);
    const utilities = convertUtilsToImports(context);
    const list = []
        .concat(parsedImports)
        .concat(utilities)
        .concat(protoImports)
        .concat(aminoImports)
        .concat(genericImports)
        .concat(additionalImports);
    if (context.options.useSDKTypes ||
        (context.options.aminoEncoding?.enabled &&
            !context.options.aminoEncoding?.useLegacyInlineEncoding)) {
        return addDerivativeTypesToImports(context, list);
    }
    else {
        return list;
    }
};
exports.aggregateImports = aggregateImports;
const getImportsFromMutations = (mutations) => {
    return mutations.map((mutation) => {
        return {
            import: mutation.messageImport,
            name: mutation.message,
        };
    });
};
exports.getImportsFromMutations = getImportsFromMutations;
// TODO implement ServiceQuery type (it is the same)
const getImportsFromQueries = (queries) => {
    return queries.reduce((m, query) => {
        const req = {
            import: query.messageImport,
            name: query.message,
        };
        const res = {
            import: query.responseImport,
            name: query.response,
        };
        return [...m, req, res];
    }, []);
};
exports.getImportsFromQueries = getImportsFromQueries;
const getDepsFromMutations = (mutations, filename) => {
    return (0, exports.getImportsFromMutations)(mutations)
        .map((imp) => {
        const f = filename;
        const f2 = imp.import;
        if (f === f2)
            return;
        const importPath = (0, utils_1.getRelativePath)(f, f2);
        return {
            ...imp,
            importPath,
        };
    })
        .filter(Boolean)
        .reduce((m, v) => {
        m[v.importPath] = m[v.importPath] ?? [];
        if (!m[v.importPath].includes(v.name)) {
            m[v.importPath].push(v.name);
        }
        return m;
    }, {});
};
exports.getDepsFromMutations = getDepsFromMutations;
const getDepsFromQueries = (queries, filename) => {
    return (0, exports.getImportsFromQueries)(queries)
        .map((imp) => {
        const f = filename;
        const f2 = imp.import;
        if (f === f2)
            return;
        const importPath = (0, utils_1.getRelativePath)(f, f2);
        return {
            ...imp,
            importPath,
        };
    })
        .filter(Boolean)
        .reduce((m, v) => {
        m[v.importPath] = m[v.importPath] ?? [];
        if (!m[v.importPath].includes(v.name)) {
            m[v.importPath].push(v.name);
        }
        return m;
    }, {});
};
exports.getDepsFromQueries = getDepsFromQueries;
