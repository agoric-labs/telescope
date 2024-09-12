"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const ts_codegen_1 = require("@cosmwasm/ts-codegen");
const plugin = async (builder) => {
    if (!builder.options.cosmwasm) {
        return;
    }
    const input = builder.options.cosmwasm;
    const cosmWasmBuilder = new ts_codegen_1.TSBuilder(input);
    await cosmWasmBuilder.build();
    const file = input.options.bundle.bundleFile;
    builder.files.push(file);
};
exports.plugin = plugin;
