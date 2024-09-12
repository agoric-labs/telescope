"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromJsonTimestamp = exports.fromTimestamp = exports.toTimestamp = exports.isSet = void 0;
const long_1 = __importDefault(require("long"));
function isSet(value) {
    return value !== null && value !== undefined;
}
exports.isSet = isSet;
function toTimestamp(date) {
    const seconds = numberToLong(date.getTime() / 1_000);
    const nanos = date.getTime() % 1000 * 1000000;
    return {
        seconds,
        nanos
    };
}
exports.toTimestamp = toTimestamp;
;
function fromTimestamp(t) {
    let millis = t.seconds.toNumber() * 1000;
    millis += t.nanos / 1000000;
    return new Date(millis);
}
exports.fromTimestamp = fromTimestamp;
;
const timestampFromJSON = (object) => {
    return {
        seconds: isSet(object.seconds) ? long_1.default.fromValue(object.seconds) : long_1.default.ZERO,
        nanos: isSet(object.nanos) ? Number(object.nanos) : 0,
    };
};
function fromJsonTimestamp(o) {
    if (o instanceof Date) {
        return toTimestamp(o);
    }
    else if (typeof o === "string") {
        return toTimestamp(new Date(o));
    }
    else {
        return timestampFromJSON(o);
    }
}
exports.fromJsonTimestamp = fromJsonTimestamp;
function numberToLong(number) {
    return long_1.default.fromNumber(number);
}
