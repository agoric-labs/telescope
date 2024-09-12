"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const imports_1 = require("../imports");
const parse_1 = require("../parse");
const plugin = (builder, bundler) => {
    if (!builder.options.aminoEncoding.enabled) {
        return;
    }
    const mutationContexts = bundler
        .contexts
        .filter(context => context.mutations.length > 0);
    // [x] write out one registry helper for all contexts w/mutations
    const registries = mutationContexts.map(c => {
        const enabled = c.amino.pluginValue('aminoEncoding.enabled');
        if (!enabled)
            return;
        if (c.proto.isExcluded())
            return;
        const localname = bundler.getLocalFilename(c.ref, 'registry');
        const filename = bundler.getFilename(localname);
        const ctx = bundler.getFreshContext(c);
        // get mutations, services
        (0, parse_1.parse)(ctx);
        ctx.buildRegistry();
        ctx.buildRegistryLoader();
        ctx.buildHelperObject();
        const serviceImports = (0, imports_1.getDepsFromMutations)(ctx.mutations, localname);
        const imports = (0, imports_1.buildAllImports)(ctx, serviceImports, localname);
        const prog = []
            .concat(imports)
            .concat(ctx.body);
        bundler.writeAst(prog, filename);
        bundler.addToBundle(c, localname);
        return {
            package: c.ref.proto.package,
            localname,
            filename
        };
    }).filter(Boolean);
    bundler.addRegistries(registries);
};
exports.plugin = plugin;
