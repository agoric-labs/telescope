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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_1 = require("../prompt");
const index_1 = __importDefault(require("../index"));
const fs_1 = require("fs");
const types_1 = require("@cosmology/types");
const path = __importStar(require("path"));
const dotty = __importStar(require("dotty"));
const deepmerge_1 = __importDefault(require("deepmerge"));
exports.default = async (argv) => {
    let options = {};
    if (argv.useDefaults) {
        const defaultOptions = { ...types_1.defaultTelescopeOptions };
        dotty.remove(defaultOptions, "aminoEncoding");
        dotty.remove(defaultOptions, "packages");
        options = defaultOptions;
    }
    else {
        options = {
            // global options (can be overridden through plugins)
            interfaces: {
                enabled: false,
                useByDefault: false,
                useUnionTypes: false,
            },
            prototypes: {
                enabled: true,
                parser: {
                    keepCase: false
                },
                methods: {
                    fromJSON: false,
                    toJSON: false,
                    encode: true,
                    decode: true,
                    fromPartial: true,
                    toAmino: true,
                    fromAmino: true,
                    fromProto: true,
                    toProto: true
                },
                addTypeUrlToObjects: true,
                addTypeUrlToDecoders: true,
                typingsFormat: {
                    duration: 'duration',
                    timestamp: 'date',
                    useExact: false,
                    useDeepPartial: false,
                    num64: 'bigint',
                    customTypes: {
                        useCosmosSDKDec: true
                    }
                },
            },
            bundle: {
                enabled: true
            },
            stargateClients: {
                enabled: true,
                includeCosmosDefaultTypes: true
            },
            aminoEncoding: {
                enabled: true,
            },
            lcdClients: {
                enabled: true
            },
            rpcClients: {
                enabled: true,
                camelCase: true
            }
        };
    }
    const questions = [
        {
            _: true,
            type: 'path',
            name: 'protoDirs',
            message: 'where is the proto directory?',
            default: './proto'
        },
        {
            _: true,
            type: 'path',
            name: 'outPath',
            message: 'where is the output directory?',
            default: './src/codegen'
        }
    ];
    if (argv.config) {
        const { config } = argv;
        const configs = Array.isArray(config) ? config : [config];
        const inputConfigFullPaths = configs.map(c => path.resolve(c));
        let configJson;
        for (const inputConfigPath of inputConfigFullPaths) {
            try {
                const configText = (0, fs_1.readFileSync)(inputConfigPath, {
                    encoding: 'utf8'
                });
                if (configJson) {
                    configJson = (0, deepmerge_1.default)(configJson, JSON.parse(configText));
                }
                else {
                    configJson = JSON.parse(configText);
                }
            }
            catch (ex) {
                console.log(ex);
                throw new Error("Must provide a .json file for --config.");
            }
        }
        // append protoDirs in config to argv.protoDirs
        argv.protoDirs = [
            ...(argv.protoDirs
                ? Array.isArray(argv.protoDirs)
                    ? argv.protoDirs
                    : [argv.protoDirs]
                : []),
            ...(configJson.protoDirs ?? []),
        ];
        if (configJson.outPath) {
            argv.outPath = configJson.outPath;
        }
        // For now, useDefaults will be override by --config
        if (configJson.options) {
            options = configJson.options;
        }
    }
    let { protoDirs, outPath, } = await (0, prompt_1.prompt)(questions, argv);
    if (!Array.isArray(protoDirs)) {
        protoDirs = [protoDirs];
    }
    // remove any duplicate protodirs
    protoDirs = [...new Set(protoDirs)];
    (0, fs_1.writeFileSync)(process.cwd() + '/.telescope.json', JSON.stringify({
        protoDirs,
        outPath,
        options
    }, null, 2));
    await (0, index_1.default)({
        protoDirs,
        outPath,
        options
    });
    console.log(`✨ transpilation successful!`);
};
