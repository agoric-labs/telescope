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
const shell = __importStar(require("shelljs"));
const fs_1 = require("fs");
const recursive_1 = require("../protod/recursive");
const utils_1 = require("../protod/utils");
const deepmerge_1 = __importDefault(require("deepmerge"));
const config_1 = require("../protod/config");
exports.default = async (argv) => {
    if (!shell.which("git")) {
        shell.echo("Sorry, this script requires git");
        return shell.exit(1);
    }
    let configJson;
    const config = Array.isArray(argv["config"])
        ? argv["config"][0]
        : argv["config"];
    if (config) {
        try {
            const configText = (0, fs_1.readFileSync)(config, {
                encoding: "utf8",
            });
            configJson = JSON.parse(configText);
        }
        catch (ex) {
            console.log(ex);
            throw new Error("Must provide a .json file for --config.");
        }
    }
    else {
        configJson = {};
    }
    const gitRepos = Array.isArray(argv["git-repo"])
        ? argv["git-repo"]
        : [argv["git-repo"]];
    if (argv["git-repo"] && gitRepos && gitRepos.length > 0) {
        configJson.repos = gitRepos.map((gitRepo) => {
            const [owner, repo, branch] = gitRepo.split("/");
            if (!owner || !repo) {
                shell.echo("wrong `git-repo` format (i.e. <owner>/<repository> or <owner>/<repository>/<branch>).\n");
                return shell.exit(1);
            }
            return { owner, repo, branch };
        });
    }
    if (!configJson.repos || configJson.repos.length === 0) {
        shell.echo("missing `git-repo` argument, you can set through `--git-repo` argument or set repos field in config file.\n");
        return shell.exit(1);
    }
    const targets = Array.isArray(argv["targets"])
        ? argv["targets"]
        : argv["targets"]?.split(",");
    if (targets && targets.length > 0) {
        configJson.targets = targets;
    }
    if (!configJson.targets || configJson.targets.length === 0) {
        shell.echo("there must be '--targets' file patterns.\n");
        shell.exit(1);
    }
    if (!configJson.protoDirMapping) {
        configJson.protoDirMapping = {};
    }
    configJson.protoDirMapping = (0, deepmerge_1.default)(config_1.presetProtoDirMapping, configJson.protoDirMapping);
    let outDir = Array.isArray(argv["out"]) ? argv["out"][0] : argv["out"];
    if (outDir) {
        configJson.outDir = outDir;
    }
    if (!configJson.outDir) {
        shell.echo("out directory is not specified, downloading to `proto` folder by default.\n");
        configJson.outDir = "proto";
    }
    let sshOpt = argv["ssh"];
    configJson.ssh = configJson.ssh || !!sshOpt;
    if (configJson.deleteTempRepoDir) {
        (0, utils_1.removeFolder)(configJson.tempRepoDir);
    }
    const result = await (0, recursive_1.cloneAll)({
        repos: configJson.repos,
        gitModulesDir: "./git-modules",
        ssh: configJson.ssh,
        protoDirMapping: configJson.protoDirMapping,
    });
    if (result) {
        (0, utils_1.removeFolder)(configJson.outDir);
        (0, recursive_1.extractProto)({
            sources: result,
            targets: configJson.targets,
            outDir: configJson.outDir,
        });
    }
};
