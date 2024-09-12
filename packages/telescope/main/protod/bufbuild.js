"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBufDeps = exports.findAllBufLockFiles = exports.findAllBufYamlFiles = exports.parseBufYamlFile = exports.parseBufLockFile = void 0;
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
const utils_1 = require("./utils");
const glob_1 = require("glob");
function parseBufLockFile(filePath) {
    if (!(0, utils_1.isPathExist)(filePath)) {
        console.warn(`No such file ${filePath}`);
        return [];
    }
    const bufLock = fs_1.default.readFileSync(filePath, "utf8");
    const deps = bufLock.split(/-\s/);
    const repos = [];
    deps.forEach((dep) => {
        if (!dep.startsWith("remote")) {
            return;
        }
        const bufDep = {
            owner: /owner:\s(.+)/.exec(dep)?.[1],
            repo: /repository:\s(.+)/.exec(dep)?.[1],
        };
        if (!bufDep.owner || !bufDep.repo) {
            throw new Error("owner or repository is missing.");
        }
        repos.push(bufDep);
    });
    return repos;
}
exports.parseBufLockFile = parseBufLockFile;
function parseBufYamlFile(filePath) {
    if (!(0, utils_1.isPathExist)(filePath)) {
        console.warn(`No such file ${filePath}`);
        return [];
    }
    const { deps } = yaml_1.default.parse(fs_1.default.readFileSync(filePath, "utf8"));
    if (deps) {
        return deps.map((dep) => {
            const [_, owner, repo] = dep.split("/");
            return {
                owner,
                repo: repo.split(":")[0],
            };
        });
    }
    return [];
}
exports.parseBufYamlFile = parseBufYamlFile;
function findAllBufYamlFiles(dir) {
    return (0, glob_1.sync)(`${dir}/**/buf.yaml`, {
        ignore: `${dir}/node_modules/**`,
    });
}
exports.findAllBufYamlFiles = findAllBufYamlFiles;
function findAllBufLockFiles(dir) {
    return (0, glob_1.sync)(`${dir}/**/buf.lock`, {
        ignore: `${dir}/node_modules/**`,
    });
}
exports.findAllBufLockFiles = findAllBufLockFiles;
function getAllBufDeps(dir) {
    const bufDeps = [];
    const bufLockFiles = findAllBufLockFiles(dir);
    bufLockFiles.map(async (filePath) => {
        const deps = parseBufLockFile(filePath);
        deps.forEach((dep) => {
            if (bufDeps.findIndex((_dep) => _dep.owner == dep.owner && _dep.repo == dep.repo) == -1) {
                bufDeps.push(dep);
            }
        });
    });
    const bufYamlFiles = findAllBufYamlFiles(dir);
    bufYamlFiles.map(async (filePath) => {
        const deps = await parseBufYamlFile(filePath);
        deps.forEach((dep) => {
            if (bufDeps.findIndex((_dep) => _dep.owner == dep.owner && _dep.repo == dep.repo) == -1) {
                bufDeps.push(dep);
            }
        });
    });
    return bufDeps;
}
exports.getAllBufDeps = getAllBufDeps;
