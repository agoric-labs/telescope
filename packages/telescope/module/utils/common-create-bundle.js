import { aggregateImports, getImportStatements } from '../imports';
import { join } from 'path';
import { TelescopeParseContext } from '../build';
import { writeAstToFile } from '../utils/files';
import { fixlocalpaths } from '../utils';
import { createEmptyProtoRef } from '@cosmology/proto-parser';
export const commonBundlePlugin = (builder, bundleFilename, packageMappings, astFn) => {
    const localname = bundleFilename;
    // create proto ref for context
    const pkg = '@root';
    const ref = createEmptyProtoRef(pkg, localname);
    // create context
    const pCtx = new TelescopeParseContext(ref, builder.store, builder.options);
    // generate code for createRpcQueryHooks and imports of related packages.
    const ast = astFn(pCtx.proto, packageMappings);
    // generate imports added by context.addUtil
    const imports = fixlocalpaths(aggregateImports(pCtx, {}, localname));
    const importStmts = getImportStatements(localname, imports, builder.options);
    // construct the AST
    const prog = [].concat(importStmts).concat(ast);
    // write the file.
    const filename = join(builder.outPath, localname);
    builder.files.push(localname);
    writeAstToFile(builder.outPath, builder.options, prog, filename);
};
