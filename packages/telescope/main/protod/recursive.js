"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractProto = exports.clone = exports.cloneAll = void 0;
const bufbuild_1 = require("./bufbuild");
const git_repo_1 = require("./git-repo");
const path_1 = require("path");
const utils_1 = require("./utils");
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
async function cloneAll({ repos, gitModulesDir, protoDirMapping, ssh, }) {
    let clonedResult = {};
    for (const { owner, repo, branch } of repos) {
        const cloned = await clone({
            owner,
            repo,
            branch,
            gitModulesDir,
            protoDirMapping,
            ssh,
            cloned: clonedResult,
        });
        for (const [key, value] of Object.entries(cloned)) {
            clonedResult[key] = value;
        }
    }
    return clonedResult;
}
exports.cloneAll = cloneAll;
async function clone({ owner, repo, branch, gitModulesDir: outDir, protoDirMapping, ssh, cloned, }) {
    let clonedResult = cloned ?? {};
    const gitRepo = new git_repo_1.GitRepo(owner, repo, ssh);
    const gitBranch = branch ?? (await gitRepo.getMainBranchName());
    const resultKey = `${owner}/${repo}/${gitBranch}`;
    if (clonedResult[resultKey]) {
        console.log(`Skip cloning ${resultKey}`);
        return clonedResult;
    }
    const gitDir = gitRepo.clone(gitBranch, 1, outDir);
    const protoDir = protoDirMapping?.[`${owner}/${repo}/${gitBranch}`] ?? "proto";
    clonedResult[`${owner}/${repo}/${gitBranch}`] = {
        owner,
        repo,
        branch: gitBranch,
        protoDir,
        protoPath: (0, path_1.resolve)(`${outDir}/${owner}/${repo}/${gitBranch}/${protoDir}`),
    };
    const bufDeps = await (0, bufbuild_1.getAllBufDeps)(gitDir);
    await Promise.all(bufDeps.map(async (bufRepo) => {
        const gitRepos = (0, utils_1.getCorrespondingGit)(bufRepo);
        await Promise.all(gitRepos.map(async (gitRepo) => {
            const gitRepoObj = new git_repo_1.GitRepo(gitRepo.owner, gitRepo.repo, ssh);
            const branch = await gitRepoObj.getMainBranchName();
            const depsClonedResult = await clone({
                ...gitRepo,
                gitModulesDir: outDir,
                branch,
                protoDirMapping,
                ssh,
                cloned: clonedResult,
            });
            for (const [key, value] of Object.entries(depsClonedResult)) {
                clonedResult[key] = value;
            }
        }));
    }));
    return clonedResult;
}
exports.clone = clone;
function extractProto({ sources, targets, outDir }) {
    const extractProtoFiles = extractProtoFromDirs({
        targets,
        sources,
    });
    extractProtoFiles.map(({ sourceFile, target }) => {
        const targetFile = (0, path_1.join)(outDir, target);
        const deepTargetDir = (0, path_1.dirname)(targetFile);
        (0, utils_1.makeDir)(deepTargetDir);
        fs_1.default.copyFileSync(sourceFile, targetFile);
        console.info(`Copied ${target} from ${sourceFile.replace(target, "")}`);
    });
}
exports.extractProto = extractProto;
function extractProtoFromDirs({ targets, sources, }) {
    const extractProtoFiles = [];
    const existingFiles = new Set();
    if (!targets || targets.length === 0) {
        return [];
    }
    if (!sources || Object.keys(sources).length === 0) {
        return [];
    }
    for (const target of targets) {
        for (const source of Object.values(sources)) {
            const files = (0, glob_1.sync)((0, path_1.join)(source.protoPath, target));
            extractProtoFiles.push(...files
                .map((file) => {
                const copyTarget = file.replace((0, path_1.resolve)(source.protoPath), "");
                const duplicate = existingFiles.has(copyTarget);
                existingFiles.add(copyTarget);
                if (!duplicate) {
                    const resultFiles = [
                        {
                            sourceFile: file,
                            target: copyTarget,
                        },
                    ];
                    const newTargets = (0, utils_1.parseProtoFile)(file);
                    if (newTargets && newTargets.length > 0) {
                        const deps = extractProtoFromDirs({
                            targets: newTargets,
                            sources,
                        });
                        const filteredDeps = deps?.filter((dep) => {
                            const depDuplicate = existingFiles.has(dep.target);
                            existingFiles.add(dep.target);
                            return !depDuplicate;
                        });
                        if (filteredDeps && filteredDeps.length > 0) {
                            resultFiles.push(...filteredDeps);
                        }
                    }
                    return resultFiles;
                }
            })
                .flat()
                .filter(Boolean));
        }
    }
    return extractProtoFiles;
}
