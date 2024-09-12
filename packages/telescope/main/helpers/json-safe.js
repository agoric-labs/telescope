"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonSafe = void 0;
exports.jsonSafe = `
export type JsonSafe<T> = T extends Uint8Array | bigint | Date
  ? string
  : T extends Array<infer U>
  ? Array<JsonSafe<U>>
  : T extends object
  ? { [K in keyof T]: JsonSafe<T[K]> }
  : T;
`;
