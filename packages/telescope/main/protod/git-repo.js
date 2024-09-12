"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRepo = void 0;
const utils_1 = require("./utils");
const branchCache = {};
class GitRepo {
    owner;
    repo;
    ssh;
    constructor(owner, repo, ssh = false) {
        this.owner = owner;
        this.repo = repo;
        this.ssh = ssh;
    }
    get fullName() {
        return `${this.owner}/${this.repo}`;
    }
    get httpsUrl() {
        return `https://github.com/${this.fullName}.git`;
    }
    get sshUrl() {
        return `git@github.com:${this.fullName}.git`;
    }
    async getMainBranchName() {
        const url = this.ssh ? this.sshUrl : this.httpsUrl;
        if (branchCache[url]) {
            return branchCache[url];
        }
        branchCache[url] = await (0, utils_1.getMainBranchName)(url);
        return branchCache[url];
    }
    clone(branch, depth = 1, outDir = "./git-modules", isOverride) {
        const dir = `${outDir}/${this.fullName}/${branch}`;
        try {
            if (!isOverride && (0, utils_1.isPathExist)(dir)) {
                console.log(`Folder ${dir} already exists, skip cloning`);
                return dir;
            }
            else {
                console.log(`Cloning to ${dir}`);
            }
            (0, utils_1.removeFolder)(dir);
            (0, utils_1.makeDir)(dir);
            (0, utils_1.exec)(`git clone ${this.ssh ? this.sshUrl : this.httpsUrl} --depth ${depth} --branch ${branch} --single-branch ${dir}`);
            console.log(`Cloned ${this.fullName}/${branch} to ${dir}`);
            return dir;
        }
        catch (error) {
            if (error.message.startsWith("Cloning into")) {
                return dir;
            }
            else {
                throw error;
            }
        }
    }
}
exports.GitRepo = GitRepo;
