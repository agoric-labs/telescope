"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelescopeBuilder = void 0;
const proto_parser_1 = require("@cosmology/proto-parser");
const build_1 = require("./build");
const types_1 = require("@cosmology/types");
const bundle_1 = require("./bundle");
const bundler_1 = require("./bundler");
const deepmerge_1 = __importDefault(require("deepmerge"));
const path_1 = require("path");
const create_types_1 = require("./generators/create-types");
const create_amino_converters_1 = require("./generators/create-amino-converters");
const create_registries_1 = require("./generators/create-registries");
const create_lcd_clients_1 = require("./generators/create-lcd-clients");
const create_aggregated_lcd_client_1 = require("./generators/create-aggregated-lcd-client");
const create_lcd_client_scoped_1 = require("./generators/create-lcd-client-scoped");
const create_rpc_query_client_scoped_1 = require("./generators/create-rpc-query-client-scoped");
const create_rpc_msg_client_scoped_1 = require("./generators/create-rpc-msg-client-scoped");
const create_rpc_query_clients_1 = require("./generators/create-rpc-query-clients");
const create_rpc_msg_clients_1 = require("./generators/create-rpc-msg-clients");
const create_react_query_bundle_1 = require("./generators/create-react-query-bundle");
const create_mobx_bundle_1 = require("./generators/create-mobx-bundle");
const create_stargate_clients_1 = require("./generators/create-stargate-clients");
const create_bundle_1 = require("./generators/create-bundle");
const create_index_1 = require("./generators/create-index");
const create_helpers_1 = require("./generators/create-helpers");
const create_cosmwasm_bundle_1 = require("./generators/create-cosmwasm-bundle");
const create_pinia_store_1 = require("./generators/create-pinia-store");
const create_pinia_store_bundle_1 = require("./generators/create-pinia-store-bundle");
const create_rpc_ops_bundle_1 = require("./generators/create-rpc-ops-bundle");
const sanitizeOptions = (options) => {
    // If an element at the same key is present for both x and y, the value from y will appear in the result.
    options = (0, deepmerge_1.default)(types_1.defaultTelescopeOptions, options ?? {});
    // strip off leading slashes
    options.tsDisable.files = options.tsDisable.files.map((file) => file.startsWith('/') ? file : file.replace(/^\//, ''));
    options.eslintDisable.files = options.eslintDisable.files.map((file) => file.startsWith('/') ? file : file.replace(/^\//, ''));
    // uniq bc of deepmerge
    options.rpcClients.enabledServices = [
        ...new Set([...options.rpcClients.enabledServices])
    ];
    return options;
};
class TelescopeBuilder {
    store;
    protoDirs;
    outPath;
    options;
    contexts = [];
    files = [];
    converters = [];
    lcdClients = [];
    rpcQueryClients = [];
    rpcMsgClients = [];
    registries = [];
    stateManagers = {};
    constructor({ protoDirs, outPath, store, options }) {
        this.protoDirs = protoDirs;
        this.outPath = (0, path_1.resolve)(outPath);
        this.options = sanitizeOptions(options);
        this.store = store ?? new proto_parser_1.ProtoStore(protoDirs, this.options);
        this.store.traverseAll();
    }
    context(ref) {
        const ctx = new build_1.TelescopeParseContext(ref, this.store, this.options);
        this.contexts.push(ctx);
        return ctx;
    }
    addStateManagers(type, files) {
        const state = this.stateManagers[type];
        if (!state) {
            this.stateManagers[type] = [];
        }
        [].push.apply(this.stateManagers[type], files);
    }
    addRPCQueryClients(files) {
        [].push.apply(this.rpcQueryClients, files);
    }
    addRPCMsgClients(files) {
        [].push.apply(this.rpcMsgClients, files);
    }
    addLCDClients(files) {
        [].push.apply(this.lcdClients, files);
    }
    addRegistries(files) {
        [].push.apply(this.registries, files);
    }
    addConverters(files) {
        [].push.apply(this.converters, files);
    }
    async build() {
        // check warnings
        if (!this.options.aminoEncoding?.enabled && (this.options.prototypes?.methods?.fromAmino || this.options.prototypes?.methods?.toAmino)) {
            console.warn("There could be compilation errors in generated code, because 'aminoEncoding.enabled: false' means amino types wouldn't be created, but 'toAmino' or 'fromAmino' need amino types.");
        }
        if (!this.options.prototypes.methods.fromPartial) {
            console.warn("The 'fromPartial' option will be deprecated in a future version. Encoder objects need fromPartial to be a creator function to create instance of the type. So it should always be left on, otherwise there could be compilation errors in generated code.");
        }
        // [x] get bundle of all packages
        const bundles = (0, bundle_1.bundlePackages)(this.store).map((bundle) => {
            // store bundleFile in filesToInclude
            const bundler = new bundler_1.Bundler(this, bundle);
            // [x] write out all TS files for package
            (0, create_types_1.plugin)(this, bundler);
            // [x] write out one amino helper for all contexts w/mutations
            (0, create_amino_converters_1.plugin)(this, bundler);
            // [x] write out one registry helper for all contexts w/mutations
            (0, create_registries_1.plugin)(this, bundler);
            // [x] write out one registry helper for all contexts w/mutations
            (0, create_lcd_clients_1.plugin)(this, bundler);
            (0, create_rpc_query_clients_1.plugin)(this, bundler);
            (0, create_rpc_msg_clients_1.plugin)(this, bundler);
            (0, create_pinia_store_1.plugin)(this, bundler);
            // [x] write out one client for each base package, referencing the last two steps
            (0, create_stargate_clients_1.plugin)(this, bundler);
            return bundler;
        });
        // post run plugins
        bundles.forEach((bundler) => {
            (0, create_lcd_client_scoped_1.plugin)(this, bundler);
            (0, create_rpc_query_client_scoped_1.plugin)(this, bundler);
            (0, create_rpc_msg_client_scoped_1.plugin)(this, bundler);
            (0, create_bundle_1.plugin)(this, bundler);
        });
        (0, create_rpc_ops_bundle_1.plugin)(this);
        (0, create_react_query_bundle_1.plugin)(this);
        (0, create_mobx_bundle_1.plugin)(this);
        (0, create_aggregated_lcd_client_1.plugin)(this);
        await (0, create_cosmwasm_bundle_1.plugin)(this);
        (0, create_helpers_1.plugin)(this);
        (0, create_pinia_store_bundle_1.plugin)(this);
        // finally, write one index file with all files, exported
        (0, create_index_1.plugin)(this);
        console.log(`✨ files transpiled in '${this.outPath}'`);
    }
}
exports.TelescopeBuilder = TelescopeBuilder;
