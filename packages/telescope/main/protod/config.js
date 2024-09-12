"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetProtoDirMapping = exports.bufInfo = void 0;
exports.bufInfo = [
    {
        owner: "protocolbuffers",
        repo: "wellknowntypes",
        git: [
            {
                owner: "protocolbuffers",
                repo: "protobuf",
            },
        ],
    },
    {
        owner: "cosmos",
        repo: "gogo-proto",
        git: [
            {
                owner: "cosmos",
                repo: "gogoproto",
            },
        ],
    },
];
exports.presetProtoDirMapping = {
    "gogo/protobuf/master": ".",
    "googleapis/googleapis/master": ".",
    "protocolbuffers/protobuf/main": "src",
};
