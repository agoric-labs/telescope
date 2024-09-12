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
exports.cli = void 0;
const prompt_1 = require("./prompt");
const cmds_1 = require("./cmds");
const cmds_2 = require("./cmds");
const pkg = __importStar(require("../package.json"));
const cli = async (argv) => {
    if (argv.v || argv.version) {
        console.log(pkg.version);
        return;
    }
    if (argv.contract) {
        const { cmd } = await (0, prompt_1.prompt)([
            {
                _: true,
                type: 'fuzzy',
                name: 'cmd',
                message: 'what do you want to do?',
                choices: Object.keys(cmds_2.Contracts)
            }
        ], argv);
        if (typeof cmds_2.Contracts[cmd] === 'function') {
            await cmds_2.Contracts[cmd](argv);
        }
        else {
            console.log('command not found.');
        }
        return;
    }
    console.log(`Telescope ${pkg.version}`);
    const { cmd } = await (0, prompt_1.prompt)([
        {
            _: true,
            type: 'fuzzy',
            name: 'cmd',
            message: 'what do you want to do?',
            choices: Object.keys(cmds_1.Commands)
        }
    ], argv);
    if (typeof cmds_1.Commands[cmd] === 'function') {
        await cmds_1.Commands[cmd](argv);
    }
    else {
        console.log('command not found.');
    }
};
exports.cli = cli;
