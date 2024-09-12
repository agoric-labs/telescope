"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDir = exports.removeFolder = exports.findAllProtoFiles = exports.isPathExist = exports.parseProtoFile = exports.getCorrespondingGit = exports.getMainBranchName = exports.exec = void 0;
const shelljs_1 = require("shelljs");
const fs_1 = __importDefault(require("fs"));
const config_1 = require("./config");
const glob_1 = require("glob");
function exec(command, verbose = false) {
    const { code, stdout, stderr } = (0, shelljs_1.exec)(command);
    if (code === 0) {
        if (verbose) {
            console.log(stdout);
        }
    }
    else {
        console.error(`Failed: ${command}`);
        throw new Error(stderr);
    }
    return { stdout };
}
exports.exec = exec;
async function getMainBranchName(url) {
    console.log(`Checking main branch for ${url}`);
    const { stdout } = exec(`git ls-remote -h ${url} main`);
    if (stdout) {
        return "main";
    }
    const { stdout: stdout2 } = exec(`git ls-remote -h ${url} master`);
    if (stdout2) {
        return "master";
    }
    throw new Error("Can't find `main` or `master` branch");
}
exports.getMainBranchName = getMainBranchName;
function getCorrespondingGit(bufRepo) {
    const bufItem = config_1.bufInfo.find((repo) => repo.owner === bufRepo.owner && repo.repo === bufRepo.repo);
    if (bufItem) {
        return bufItem.git;
    }
    else {
        return [bufRepo];
    }
}
exports.getCorrespondingGit = getCorrespondingGit;
function parseProtoFile(filePath) {
    if (!isPathExist(filePath)) {
        console.warn(`No such file ${filePath}`);
        return [];
    }
    let proto;
    try {
        proto = fs_1.default.readFileSync(filePath, "utf8");
    }
    catch (error) {
        console.log(filePath);
        throw new Error(error);
    }
    const deps = [];
    proto?.split("\n").forEach((line) => {
        if (line.trim().startsWith("import ")) {
            const dep = /import\s"(.+)";?/.exec(line)?.[1];
            if (!dep) {
                throw Error(`Failed to parse line: ${line}`);
            }
            deps.push(dep);
        }
    });
    return deps;
}
exports.parseProtoFile = parseProtoFile;
function isPathExist(path) {
    return fs_1.default.existsSync(path);
}
exports.isPathExist = isPathExist;
function findAllProtoFiles(dir) {
    return (0, glob_1.sync)(`${dir}/**/*.proto`, {
        ignore: `${dir}/node_modules/**`,
    });
}
exports.findAllProtoFiles = findAllProtoFiles;
function removeFolder(dir) {
    fs_1.default.rmSync(dir, { recursive: true, force: true });
}
exports.removeFolder = removeFolder;
function makeDir(dir) {
    fs_1.default.mkdirSync(dir, { recursive: true });
}
exports.makeDir = makeDir;
