#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("./cli");
var argv = require('minimist')(process.argv.slice(2), {
    boolean: ['ssh']
});
(async () => {
    await (0, cli_1.cli)(argv);
})();
