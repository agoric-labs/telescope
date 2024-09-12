"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bundler = void 0;
const path_1 = require("path");
const build_1 = require("./build");
const bundle_1 = require("./bundle");
const files_1 = require("./utils/files");
class Bundler {
    builder;
    contexts = [];
    bundle;
    files;
    converters = [];
    lcdClients = [];
    rpcQueryClients = [];
    rpcMsgClients = [];
    registries = [];
    stateManagers = {};
    constructor(builder, bundle) {
        this.builder = builder;
        this.bundle = bundle;
        this.files = [
            bundle.bundleFile
        ];
    }
    addStateManagers(type, files) {
        const state = this.stateManagers[type];
        if (!state) {
            this.stateManagers[type] = [];
        }
        [].push.apply(this.stateManagers[type], files);
        this.builder.addStateManagers(type, files);
    }
    addLCDClients(files) {
        [].push.apply(this.lcdClients, files);
        this.builder.addLCDClients(files);
    }
    addRPCQueryClients(files) {
        [].push.apply(this.rpcQueryClients, files);
        this.builder.addRPCQueryClients(files);
    }
    addRPCMsgClients(files) {
        [].push.apply(this.rpcMsgClients, files);
        this.builder.addRPCMsgClients(files);
    }
    addRegistries(files) {
        [].push.apply(this.registries, files);
        this.builder.addRegistries(files);
    }
    addConverters(files) {
        [].push.apply(this.converters, files);
        this.builder.addConverters(files);
    }
    getFreshContext(context) {
        return new build_1.TelescopeParseContext(context.ref, context.store, this.builder.options);
    }
    getLocalFilename(ref, suffix) {
        return suffix ?
            ref.filename.replace(/\.proto$/, `.${suffix}.ts`) :
            ref.filename.replace(/\.proto$/, `.ts`);
    }
    getFilename(localname) {
        return (0, path_1.resolve)((0, path_1.join)(this.builder.outPath, localname));
    }
    writeAst(program, filename) {
        (0, files_1.writeAstToFile)(this.builder.outPath, this.builder.options, program, filename);
    }
    // addToBundle adds the path into the namespaced bundle object
    addToBundle(context, localname) {
        (0, bundle_1.createFileBundle)(this.builder.options, context.ref.proto.package, localname, this.bundle.bundleFile, this.bundle.importPaths, this.bundle.bundleVariables);
    }
    addToBundleToPackage(packagename, localname) {
        (0, bundle_1.createFileBundle)(this.builder.options, packagename, localname, this.bundle.bundleFile, this.bundle.importPaths, this.bundle.bundleVariables);
    }
}
exports.Bundler = Bundler;
