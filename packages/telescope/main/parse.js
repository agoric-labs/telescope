"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRecur = exports.parseService = exports.parseEnum = exports.parseType = exports.getParsedObjectName = exports.parse = void 0;
const types_1 = require("@cosmology/types");
const proto_parser_1 = require("@cosmology/proto-parser");
const ast_1 = require("@cosmology/ast");
const utils_1 = require("./utils");
const parse = (context) => {
    const root = (0, utils_1.getRoot)(context.ref);
    (0, exports.parseRecur)({
        context,
        obj: root.root,
        scope: [],
        isNested: false
    });
};
exports.parse = parse;
const getParsedObjectName = (ref, obj, scope) => {
    const _scope = [...scope];
    const root = (0, utils_1.getRoot)(ref);
    const allButPackage = _scope.splice(root.package.split('.').length);
    // pull off "this" name
    allButPackage.pop();
    return (0, proto_parser_1.getObjectName)(obj.name, [root.package, ...allButPackage]);
};
exports.getParsedObjectName = getParsedObjectName;
// TODO potentially move this back to ast or proto bc the ast lib references MapEntries...
// Creating those BindingsEntry interfaces
const makeKeyTypeObj = (ref, field, scope) => {
    const root = (0, utils_1.getRoot)(ref);
    const scoped = [...scope].splice(root.package.split('.').length);
    const adhocObj = {
        type: 'Type',
        comment: undefined,
        fields: {
            key: {
                id: 1,
                type: field.keyType,
                scope: [...scoped],
                parsedType: {
                    name: field.keyType,
                    type: field.keyType
                },
                comment: undefined,
                options: {
                    "(telescope:map_entry_type_field)": true
                }
            },
            value: {
                id: 2,
                type: field.type,
                scope: [...scoped],
                parsedType: {
                    name: field.parsedType.name,
                    type: field.parsedType.type
                },
                comment: undefined,
                options: {
                    "(telescope:map_entry_type_field)": true
                }
            }
        }
    };
    return adhocObj;
};
const parseType = (context, obj, 
// scope already has the name of "this" field at the end of it
scope, isNested = false) => {
    obj.keyTypes.forEach(field => {
        const keyTypeObject = makeKeyTypeObj(context.ref, field, [...scope]);
        const name = (0, exports.getParsedObjectName)(context.ref, {
            name: (0, ast_1.getKeyTypeEntryName)(obj.name, field.name)
        }, [...scope]);
        context.addType(name, keyTypeObject, true);
    });
    // parse nested names
    let name = obj.name;
    if (isNested) {
        name = (0, exports.getParsedObjectName)(context.ref, obj, [...scope]);
    }
    context.addType(name, obj, isNested);
    // render nested LAST
    if (obj.nested) {
        Object.keys(obj.nested).forEach(key => {
            // isNested = true;
            (0, exports.parseRecur)({
                context,
                obj: obj.nested[key],
                scope: [...scope, key],
                isNested: true
            });
        });
    }
};
exports.parseType = parseType;
const parseEnum = (context, obj, scope, isNested = false) => {
    let name = obj.name;
    let enumObj = {
        ...obj,
        package: context.ref.proto.package
    };
    // parse nested names
    if (isNested) {
        name = (0, exports.getParsedObjectName)(context.ref, enumObj, scope);
    }
    context.addType(name, enumObj, isNested);
};
exports.parseEnum = parseEnum;
const parseService = (context, obj, scope, isNested = false) => {
    const methodHash = obj.methods;
    if (!types_1.ALLOWED_RPC_SERVICES.includes(obj.name)) {
        return;
    }
    Object.entries(methodHash)
        .forEach(([key, value]) => {
        const lookup = context.store.get(context.ref, value.requestType);
        if (!lookup) {
            console.warn(`cannot find ${value.requestType}`);
            throw new Error('undefined symbol for service.');
        }
        const lookupResponse = context.store.get(context.ref, value.responseType);
        if (!lookupResponse) {
            console.warn(`cannot find ${value.responseType}`);
            throw new Error('undefined symbol for service.');
        }
        const serviceInfo = {
            methodName: key,
            package: context.ref.proto.package,
            message: lookup.importedName,
            messageImport: lookup.import ?? context.ref.filename,
            response: lookupResponse.importedName,
            responseImport: lookupResponse.import ?? context.ref.filename,
            comment: value.comment
        };
        switch (obj.name) {
            case 'Msg':
                context.addMutation(serviceInfo);
                break;
            case 'Query':
                context.addQuery(serviceInfo);
                break;
            default:
                context.addService(serviceInfo);
                break;
        }
    });
};
exports.parseService = parseService;
const parseRecur = ({ context, obj, scope, isNested }) => {
    switch (obj.type) {
        case 'Type':
            return (0, exports.parseType)(context, obj, scope, isNested);
        case 'Enum':
            return (0, exports.parseEnum)(context, obj, scope, isNested);
        case 'Service':
            return (0, exports.parseService)(context, obj, scope, isNested);
        case 'Field':
            console.log(obj);
            return;
        case 'Root':
        case 'Namespace':
            if (obj.nested) {
                return Object.keys(obj.nested).forEach(key => {
                    (0, exports.parseRecur)({
                        context,
                        obj: obj.nested[key],
                        scope: [...scope, key],
                        isNested
                    });
                });
            }
            else {
                throw new Error('parseRecur() cannot find protobufjs Type');
            }
        default:
        // if (obj.type === 'string') return;
        // if (obj.type === 'bool') return;
        // if (obj.type === 'HttpRule') return;
        // if (obj.type === 'InterfaceDescriptor') return;
        // if (obj.type === 'ScalarDescriptor') return;
        // if (obj.type === 'ModuleDescriptor') return;
        // if (obj.type === 'TableDescriptor') return;
        // if (obj.type === 'SingletonDescriptor') return;
        // if (obj.type === 'ModuleSchemaDescriptor') return;
        // if (obj.type === 'google.api.FieldBehavior') return;
        // if (obj.type === 'google.api.ResourceReference') return;
        // if (obj.type === 'google.api.ResourceDescriptor') return;
        // if (obj.type === 'google.api.RoutingRule') return;
        // if (obj.type === 'google.api.VisibilityRule') return;
        // if (obj.type === 'google.longrunning.OperationInfo') return;
        // throw new Error('parseRecur() cannot find protobufjs Type')
    }
};
exports.parseRecur = parseRecur;
