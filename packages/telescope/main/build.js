"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelescopeParseContext = exports.buildEnums = exports.buildBaseTypeScriptInterface = exports.buildBaseTypeScriptClass = exports.getAminoProtos = exports.getMutations = void 0;
const ast_1 = require("@cosmology/ast");
const getMutations = (mutations) => {
    return mutations.map((mutation) => {
        return {
            typeUrl: `/${mutation.package}.${mutation.message}`,
            TypeName: mutation.message,
            methodName: mutation.methodName
        };
    });
};
exports.getMutations = getMutations;
const getAminoProtos = (mutations, store) => {
    return mutations.map(mutation => {
        const ref = store.findProto(mutation.messageImport);
        return store.get(ref, mutation.message).obj;
    });
};
exports.getAminoProtos = getAminoProtos;
const buildBaseTypeScriptClass = (context, name, obj) => {
    if (context.options.prototypes.enabled) {
        context.body.push((0, ast_1.createCreateProtoType)(context.proto, name, obj));
        context.body.push((0, ast_1.createObjectWithMethods)(context.proto, name, obj));
        if (context.options.interfaces?.enabled && context.options.interfaces?.useGlobalDecoderRegistry) {
            const registerObj = (0, ast_1.createRegisterObject)(context.proto, name, obj);
            if (registerObj) {
                context.body.push(registerObj);
                //createRegisterAminoProtoMapping
                const registerAminoObj = (0, ast_1.createRegisterAminoProtoMapping)(context.proto, name, obj);
                if (registerAminoObj) {
                    context.body.push(registerAminoObj);
                }
            }
        }
    }
};
exports.buildBaseTypeScriptClass = buildBaseTypeScriptClass;
const buildBaseTypeScriptInterface = (context, name, obj) => {
    context.body.push((0, ast_1.createProtoType)(context.proto, name, obj));
    if (context.options.aminoEncoding?.enabled && !context.options.aminoEncoding?.useLegacyInlineEncoding || context.options.prototypes?.methods?.fromProto || context.options.prototypes?.methods?.toProto) {
        context.body.push((0, ast_1.createProtoTypeType)(context.proto, name, obj));
    }
    if (context.options.aminoEncoding?.enabled && !context.options.aminoEncoding?.useLegacyInlineEncoding) {
        // conditional type
        const interfaceType = (0, ast_1.createProtoInterfaceEncodedType)(context.proto, name, obj);
        if (interfaceType) {
            context.body.push(interfaceType);
        }
        context.body.push((0, ast_1.createAminoType)(context.proto, name, obj));
        if (!context.options.aminoEncoding?.disableMsgTypes) {
            context.body.push((0, ast_1.createAminoTypeType)(context.proto, name, obj));
        }
    }
    if (context.options.useSDKTypes) {
        context.body.push((0, ast_1.createSDKType)(context.proto, name, obj));
    }
};
exports.buildBaseTypeScriptInterface = buildBaseTypeScriptInterface;
const buildEnums = (context, name, obj) => {
    context.body.push((0, ast_1.createProtoEnum)(context.proto, name, obj));
    if (context.options.useSDKTypes) {
        context.body.push((0, ast_1.createEnumSDKType)(context.proto, name, obj));
    }
    if (context.options.aminoEncoding?.enabled && !context.options.aminoEncoding?.useLegacyInlineEncoding) {
        context.body.push((0, ast_1.createEnumAminoType)(context.proto, name, obj));
    }
    context.body.push((0, ast_1.createProtoEnumFromJSON)(context.proto, name, obj));
    context.body.push((0, ast_1.createProtoEnumToJSON)(context.proto, name, obj));
};
exports.buildEnums = buildEnums;
class TelescopeParseContext {
    constructor(ref, store, options) {
        this.generic = new ast_1.GenericParseContext(ref, store, options);
        this.proto = new ast_1.ProtoParseContext(ref, store, options);
        this.amino = new ast_1.AminoParseContext(ref, store, options);
        this.options = options;
        this.ref = ref;
        this.store = store;
        this.parsedImports = {};
        this.body = [];
        this.queries = [];
        this.services = [];
        this.mutations = [];
        this.types = [];
    }
    hasMutations() {
        return this.mutations.length > 0;
    }
    addType(name, obj, isNested) {
        this.types.push({
            name,
            obj,
            isNested
        });
    }
    addMutation(mutation) {
        this.mutations.push(mutation);
    }
    addQuery(query) {
        this.queries.push(query);
    }
    addService(query) {
        this.services.push(query);
    }
    // build main Class with methods
    buildBase() {
        this.types.forEach(typeReg => {
            const { name, obj } = typeReg;
            if (obj.type === 'Enum') {
                (0, exports.buildEnums)(this, name, obj);
            }
        });
        this.types.forEach(typeReg => {
            const { name, obj } = typeReg;
            if (obj.type === 'Type') {
                (0, exports.buildBaseTypeScriptInterface)(this, name, obj);
            }
        });
        this.types.forEach(typeReg => {
            const { name, obj } = typeReg;
            if (obj.type === 'Type') {
                (0, exports.buildBaseTypeScriptClass)(this, name, obj);
            }
        });
        // interfaces
        if (this.options.interfaces.enabled && !this.options.interfaces.useGlobalDecoderRegistry) {
            const interfaces = Object.keys(this.ref.traversed.acceptsInterface ?? {});
            if (interfaces.length) {
                interfaces.forEach(interfaceName => {
                    this.body.push((0, ast_1.createInterfaceDecoder)(this.proto, this.ref, interfaceName));
                    if (this.options.aminoEncoding?.enabled &&
                        !this.options.aminoEncoding?.useLegacyInlineEncoding) {
                        this.body.push((0, ast_1.createInterfaceFromAmino)(this.proto, this.ref, interfaceName));
                        this.body.push((0, ast_1.createInterfaceToAmino)(this.proto, this.ref, interfaceName));
                    }
                });
            }
        }
    }
    buildRegistry() {
        this.body.push((0, ast_1.createTypeRegistry)(this.amino, (0, exports.getMutations)(this.mutations)));
    }
    buildRegistryLoader() {
        if (!this.options?.prototypes?.enableRegistryLoader) {
            return;
        }
        this.body.push((0, ast_1.createRegistryLoader)(this.amino));
    }
    buildAminoInterfaces() {
        if (!this.options?.aminoEncoding?.enabled || !this.options?.aminoEncoding?.useLegacyInlineEncoding)
            return;
        //
        const protos = (0, exports.getAminoProtos)(this.mutations, this.store);
        protos.forEach(proto => {
            this.body.push((0, ast_1.makeAminoTypeInterface)({
                context: this.amino,
                proto
            }));
        });
    }
    buildAminoConverter() {
        this.body.push((0, ast_1.createAminoConverter)({
            name: 'AminoConverter',
            context: this.amino,
            root: this.ref.traversed,
            protos: (0, exports.getAminoProtos)(this.mutations, this.store)
        }));
    }
    buildHelperObject() {
        if (!this.options?.prototypes?.enableMessageComposer) {
            return;
        }
        // add methods
        this.body.push((0, ast_1.createHelperObject)({
            context: this.amino,
            name: 'MessageComposer',
            mutations: (0, exports.getMutations)(this.mutations)
        }));
    }
}
exports.TelescopeParseContext = TelescopeParseContext;
