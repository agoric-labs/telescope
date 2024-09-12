"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContractSchemata = exports.getContracts = exports.getDirectories = void 0;
const ts_codegen_1 = require("@cosmwasm/ts-codegen");
const case_1 = require("case");
const path_1 = require("path");
const fs_1 = require("fs");
const getDirectories = source => (0, fs_1.readdirSync)(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
exports.getDirectories = getDirectories;
const getContracts = () => {
    const contracts = (0, exports.getDirectories)('./contracts')
        .map(contractDirname => {
        return {
            name: `${contractDirname}`,
            value: `./contracts/${contractDirname}`
        };
    });
    return contracts;
};
exports.getContracts = getContracts;
const getContractSchemata = async (schemata, out, argv) => {
    const s = [];
    for (let i = 0; i < schemata.length; i++) {
        const path = schemata[i];
        const pkg = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(path, 'package.json'), 'utf-8'));
        const name = (0, path_1.basename)(path);
        const folder = (0, path_1.basename)((0, path_1.dirname)(path));
        const contractName = (0, case_1.pascal)(pkg.contract) || (0, case_1.pascal)(name);
        const schemas = await (0, ts_codegen_1.readSchemas)({ schemaDir: path });
        const outPath = (0, path_1.join)(out, folder);
        s.push({
            contractName, schemas, outPath
        });
    }
    return s;
};
exports.getContractSchemata = getContractSchemata;
