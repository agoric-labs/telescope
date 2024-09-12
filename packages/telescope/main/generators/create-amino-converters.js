"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const imports_1 = require("../imports");
const parse_1 = require("../parse");
const plugin = (builder, bundler) => {
    const aminoEncoding = builder.options.aminoEncoding;
    if (!aminoEncoding.enabled) {
        return;
    }
    const mutationContexts = bundler
        .contexts
        .filter(context => context.mutations.length > 0);
    const converters = mutationContexts.map(c => {
        const aminoEncodingEnabled = c.amino.pluginValue('aminoEncoding.enabled');
        if (!aminoEncodingEnabled) {
            return;
        }
        const localname = bundler.getLocalFilename(c.ref, 'amino');
        const filename = bundler.getFilename(localname);
        const ctx = bundler.getFreshContext(c);
        // get mutations, services
        (0, parse_1.parse)(ctx);
        // now let's amino...
        ctx.buildAminoInterfaces();
        ctx.buildAminoConverter();
        const serviceImports = (0, imports_1.getDepsFromMutations)(ctx.mutations, localname);
        // build file
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
    bundler.addConverters(converters);
};
exports.plugin = plugin;
