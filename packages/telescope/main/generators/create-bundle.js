"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const ast_1 = require("@cosmology/ast");
const utils_1 = require("@cosmology/utils");
const plugin = (builder, bundler) => {
    if (!builder.options.bundle.enabled) {
        return;
    }
    const importPaths = (0, utils_1.duplicateImportPathsWithExt)(bundler.bundle.importPaths, builder.options.restoreImportExtension);
    // [x] bundle
    const body = (0, ast_1.recursiveModuleBundle)(builder.options, bundler.bundle.bundleVariables);
    const prog = []
        .concat(importPaths)
        .concat(body);
    const localname = bundler.bundle.bundleFile;
    const filename = bundler.getFilename(localname);
    bundler.writeAst(prog, filename);
    // [x] write an index file for each base
    bundler.files.forEach(file => builder.files.push(file));
};
exports.plugin = plugin;
