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
exports.writeContentToFile = exports.writeAstToFile = void 0;
const t = __importStar(require("@babel/types"));
const parser_1 = require("@babel/parser");
const mkdirp_1 = require("mkdirp");
const fs_1 = require("fs");
const path_1 = require("path");
const minimatch_1 = __importDefault(require("minimatch"));
const generator_1 = __importDefault(require("@babel/generator"));
const unused_1 = require("./unused");
const traverse_1 = __importDefault(require("@babel/traverse"));
const writeAstToFile = (outPath, options, program, filename) => {
    const ast = t.program(program);
    const content = (0, generator_1.default)(ast).code;
    if (options.removeUnusedImports) {
        const plugins = [
            'typescript'
        ];
        const newAst = (0, parser_1.parse)(content, {
            sourceType: 'module',
            plugins
        });
        (0, traverse_1.default)(newAst, unused_1.unused);
        const content2 = (0, generator_1.default)(newAst).code;
        (0, exports.writeContentToFile)(outPath, options, content2, filename);
    }
    else {
        (0, exports.writeContentToFile)(outPath, options, content, filename);
    }
};
exports.writeAstToFile = writeAstToFile;
const writeContentToFile = (outPath, options, content, filename) => {
    let esLintPrefix = '';
    let tsLintPrefix = '';
    let nameWithoutPath = filename.replace(outPath, '');
    // strip off leading slash
    if (nameWithoutPath.startsWith('/'))
        nameWithoutPath = nameWithoutPath.replace(/^\//, '');
    options.tsDisable.patterns.forEach(pattern => {
        if ((0, minimatch_1.default)(nameWithoutPath, pattern)) {
            tsLintPrefix = `//@ts-nocheck\n`;
        }
    });
    options.eslintDisable.patterns.forEach(pattern => {
        if ((0, minimatch_1.default)(nameWithoutPath, pattern)) {
            esLintPrefix = `/* eslint-disable */\n`;
        }
    });
    if (options.tsDisable.files.includes(nameWithoutPath) ||
        options.tsDisable.disableAll) {
        tsLintPrefix = `//@ts-nocheck\n`;
    }
    if (options.eslintDisable.files.includes(nameWithoutPath) ||
        options.eslintDisable.disableAll) {
        esLintPrefix = `/* eslint-disable */\n`;
    }
    const text = tsLintPrefix + esLintPrefix + content;
    mkdirp_1.mkdirp.sync((0, path_1.dirname)(filename));
    (0, fs_1.writeFileSync)(filename, text);
};
exports.writeContentToFile = writeContentToFile;
