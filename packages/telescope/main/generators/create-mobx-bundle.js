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
const ast_1 = require("@cosmology/ast");
const dotty = __importStar(require("dotty"));
const utils_1 = require("../utils");
const plugin = (builder) => {
    // if mobx is enabled
    // generate stores.ts based on query hooks generated in each package.
    // eg: __fixtures__/output1/stores.ts
    if (!builder.options.mobx?.enabled) {
        return;
    }
    // get mapping of packages and rpc query filenames.
    const obj = {};
    const bundlerFiles = builder.stateManagers["mobx"];
    if (!bundlerFiles || !bundlerFiles.length) {
        return;
    }
    bundlerFiles.map((queryClient) => {
        const path = `./${queryClient.localname.replace(/\.ts$/, '')}`;
        dotty.put(obj, queryClient.package, path);
    });
    (0, utils_1.commonBundlePlugin)(builder, 'mobx.stores.ts', obj, (context, obj) => {
        // generate code for createRpcQueryHooks and imports of related packages.
        return (0, ast_1.createMobxQueryFactory)(context, obj);
    });
};
exports.plugin = plugin;
