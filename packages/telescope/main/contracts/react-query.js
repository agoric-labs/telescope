"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_1 = require("../prompt");
const ts_codegen_1 = require("@cosmwasm/ts-codegen");
const contracts_1 = require("../utils/contracts");
exports.default = async (argv) => {
    const contracts = (0, contracts_1.getContracts)();
    const questions = [
        {
            _: true,
            type: 'checkbox',
            name: 'schema',
            message: 'which directory contains the the Rust contracts?',
            choices: contracts
        },
        {
            _: true,
            type: 'path',
            name: 'out',
            message: 'where is the output directory?',
            default: './src/contracts'
        }
    ];
    let { schema, out } = await (0, prompt_1.prompt)(questions, argv);
    if (!Array.isArray(schema))
        schema = [schema];
    const s = await (0, contracts_1.getContractSchemata)(schema, out, argv);
    s.forEach(async ({ contractName, schemas, outPath }) => {
        await (0, ts_codegen_1.generateReactQuery)(contractName, schemas, outPath);
    });
};
