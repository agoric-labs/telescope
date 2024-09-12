import { ProtoStore } from '@cosmology/proto-parser';
import { TelescopeParseContext } from './build';
import { defaultTelescopeOptions } from '@cosmology/types';
import { bundlePackages } from './bundle';
import { Bundler } from './bundler';
import deepmerge from 'deepmerge';
import { resolve } from 'path';
import { plugin as createTypes } from './generators/create-types';
import { plugin as createAminoConverters } from './generators/create-amino-converters';
import { plugin as createRegistries } from './generators/create-registries';
import { plugin as createLCDClients } from './generators/create-lcd-clients';
import { plugin as createAggregatedLCDClient } from './generators/create-aggregated-lcd-client';
import { plugin as createLCDClientsScoped } from './generators/create-lcd-client-scoped';
import { plugin as createRPCQueryClientsScoped } from './generators/create-rpc-query-client-scoped';
import { plugin as createRPCMsgClientsScoped } from './generators/create-rpc-msg-client-scoped';
import { plugin as createRPCQueryClients } from './generators/create-rpc-query-clients';
import { plugin as createRPCMsgClients } from './generators/create-rpc-msg-clients';
import { plugin as createReactQueryBundle } from './generators/create-react-query-bundle';
import { plugin as createMobxBundle } from './generators/create-mobx-bundle';
import { plugin as createStargateClients } from './generators/create-stargate-clients';
import { plugin as createBundle } from './generators/create-bundle';
import { plugin as createIndex } from './generators/create-index';
import { plugin as createHelpers } from './generators/create-helpers';
import { plugin as createCosmWasmBundle } from './generators/create-cosmwasm-bundle';
import { plugin as createPiniaStore } from './generators/create-pinia-store';
import { plugin as createPiniaStoreBundle } from './generators/create-pinia-store-bundle';
import { plugin as createRpcOpsBundle } from './generators/create-rpc-ops-bundle';
const sanitizeOptions = (options) => {
    // If an element at the same key is present for both x and y, the value from y will appear in the result.
    options = deepmerge(defaultTelescopeOptions, options ?? {});
    // strip off leading slashes
    options.tsDisable.files = options.tsDisable.files.map((file) => file.startsWith('/') ? file : file.replace(/^\//, ''));
    options.eslintDisable.files = options.eslintDisable.files.map((file) => file.startsWith('/') ? file : file.replace(/^\//, ''));
    // uniq bc of deepmerge
    options.rpcClients.enabledServices = [
        ...new Set([...options.rpcClients.enabledServices])
    ];
    return options;
};
export class TelescopeBuilder {
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
        this.outPath = resolve(outPath);
        this.options = sanitizeOptions(options);
        this.store = store ?? new ProtoStore(protoDirs, this.options);
        this.store.traverseAll();
    }
    context(ref) {
        const ctx = new TelescopeParseContext(ref, this.store, this.options);
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
        const bundles = bundlePackages(this.store).map((bundle) => {
            // store bundleFile in filesToInclude
            const bundler = new Bundler(this, bundle);
            // [x] write out all TS files for package
            createTypes(this, bundler);
            // [x] write out one amino helper for all contexts w/mutations
            createAminoConverters(this, bundler);
            // [x] write out one registry helper for all contexts w/mutations
            createRegistries(this, bundler);
            // [x] write out one registry helper for all contexts w/mutations
            createLCDClients(this, bundler);
            createRPCQueryClients(this, bundler);
            createRPCMsgClients(this, bundler);
            createPiniaStore(this, bundler);
            // [x] write out one client for each base package, referencing the last two steps
            createStargateClients(this, bundler);
            return bundler;
        });
        // post run plugins
        bundles.forEach((bundler) => {
            createLCDClientsScoped(this, bundler);
            createRPCQueryClientsScoped(this, bundler);
            createRPCMsgClientsScoped(this, bundler);
            createBundle(this, bundler);
        });
        createRpcOpsBundle(this);
        createReactQueryBundle(this);
        createMobxBundle(this);
        createAggregatedLCDClient(this);
        await createCosmWasmBundle(this);
        createHelpers(this);
        createPiniaStoreBundle(this);
        // finally, write one index file with all files, exported
        createIndex(this);
        console.log(`✨ files transpiled in '${this.outPath}'`);
    }
}
