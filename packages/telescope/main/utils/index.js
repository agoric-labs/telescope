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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelativePath = exports.fixlocalpaths = exports.UTIL_HELPERS = exports.UTILS = exports.getRoot = void 0;
const path_1 = require("path");
const utils_1 = require("@cosmology/utils");
const getRoot = (ref) => {
    if (ref.traversed)
        return ref.traversed;
    return ref.proto;
};
exports.getRoot = getRoot;
// default example:
// Long: { type: 'default', path: 'long', name: 'Long ' },
// namespaced:
// _m0: { type: 'namespace', path: 'protobufjs/minimal', name: '_m0' },
exports.UTILS = {
    _m0: { type: 'namespace', path: 'protobufjs/minimal', name: '_m0' },
    AminoHeight: '__helpers__',
    AminoMsg: '@cosmjs/amino',
    AminoTypes: '@cosmjs/stargate',
    base64FromBytes: '__helpers__',
    bytesFromBase64: '__helpers__',
    BrowserHeaders: 'browser-headers',
    connectComet: '@cosmjs/tendermint-rpc',
    Decimal: '__helpers__',
    padDecimal: '__helpers__',
    createProtobufRpcClient: '@cosmjs/stargate',
    Pubkey: '@cosmjs/amino',
    decodeBech32Pubkey: '@cosmjs/amino',
    DeepPartial: '__helpers__',
    defaultRegistryTypes: '@cosmjs/stargate',
    encodeBech32Pubkey: '@cosmjs/amino',
    Exact: '__helpers__',
    fm: { type: 'namespace', path: '__grpc-gateway__', name: 'fm' },
    encodePubkey: '@cosmjs/proto-signing',
    decodePubkey: '@cosmjs/proto-signing',
    fromBase64: '@cosmjs/encoding',
    fromBech32: '@cosmjs/encoding',
    fromDuration: '__helpers__',
    fromHex: '@cosmjs/encoding',
    fromJsonTimestamp: '__helpers__',
    fromTimestamp: '__helpers__',
    fromUtf8: '@cosmjs/encoding',
    GeneratedType: '@cosmjs/proto-signing',
    getRpcClient: '__extern__',
    createRpcClient: '__extern__',
    getRpcEndpointKey: '__extern__',
    HttpEndpoint: '@cosmjs/tendermint-rpc',
    isObject: '__helpers__',
    isSet: '__helpers__',
    LCDClient: '@cosmology/lcd',
    Long: '__helpers__',
    OfflineSigner: '@cosmjs/proto-signing',
    omitDefault: '__helpers__',
    ProtobufRpcClient: '@cosmjs/stargate',
    QueryClient: '@cosmjs/stargate',
    Registry: '@cosmjs/proto-signing',
    Rpc: '__helpers__',
    StdFee: '__types__',
    TxRpc: '__types__',
    BroadcastTxReq: '__types__',
    BroadcastTxRes: '__types__',
    DeliverTxResponse: '__types__',
    EncodeObject: '__types__',
    SigningClientParams: '__types__',
    grpc: '@improbable-eng/grpc-web',
    setPaginationParams: '__helpers__',
    SigningStargateClient: '@cosmjs/stargate',
    Tendermint34Client: '@cosmjs/tendermint-rpc',
    toBase64: '@cosmjs/encoding',
    toDuration: '__helpers__',
    toTimestamp: '__helpers__',
    toUtf8: '@cosmjs/encoding',
    useQuery: '@tanstack/react-query',
    useRpcEndpoint: '__react-query__',
    useRpcClient: '__react-query__',
    useTendermintClient: '__react-query__',
    ReactQueryParams: '__react-query__',
    UseQueryOptions: '@tanstack/react-query',
    QueryStore: '__mobx__',
    MobxResponse: '__mobx__',
    useEndpoint: '__pinia-endpoint__',
    JsonSafe: '__json-safe__',
    override: 'mobx',
    makeObservable: 'mobx',
    NodeHttpTransport: '@improbable-eng/grpc-web-node-http-transport',
    UnaryMethodDefinitionishR: '__grpc-web__',
    UnaryMethodDefinitionish: '__grpc-web__',
    BinaryReader: '__binary__',
    BinaryWriter: '__binary__',
    TelescopeGeneratedType: '__types__',
    GlobalDecoderRegistry: '__registry__',
};
exports.UTIL_HELPERS = [
    '__helpers__',
    '__extern__',
    '__react-query__',
    '__mobx__',
    '__binary__',
    '__pinia-endpoint__',
    '__json-safe__',
    '__grpc-gateway__',
    '__grpc-web__',
    '__types__',
    '__registry__'
];
const fixlocalpaths = (imports) => {
    return imports.map(imp => {
        return {
            ...imp,
            path: (exports.UTIL_HELPERS.includes(imp.path) || imp.path.startsWith('.') || imp.path.startsWith('@')) ?
                imp.path : `./${imp.path}`
        };
    });
};
exports.fixlocalpaths = fixlocalpaths;
const getRelativePath = (f1, f2, ext) => {
    const rel = (0, path_1.relative)((0, path_1.dirname)(f1), f2);
    let importPath = rel.replace((0, path_1.extname)(rel), '');
    if (!/^\./.test(importPath))
        importPath = `./${importPath}`;
    return (0, utils_1.restoreExtension)(importPath, ext);
};
exports.getRelativePath = getRelativePath;
__exportStar(require("./common-create-bundle"), exports);
