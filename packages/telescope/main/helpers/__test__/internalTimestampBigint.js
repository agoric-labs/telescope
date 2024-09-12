"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromJsonTimestamp = exports.fromTimestamp = exports.toTimestamp = exports.isSet = void 0;
function isSet(value) {
    return value !== null && value !== undefined;
}
exports.isSet = isSet;
function toTimestamp(date) {
    const seconds = numberToLong(date.getTime() / 1_000);
    const nanos = (date.getTime() % 1000) * 1000000;
    return {
        seconds,
        nanos
    };
}
exports.toTimestamp = toTimestamp;
function fromTimestamp(t) {
    let millis = Number(t.seconds) * 1000;
    millis += t.nanos / 1000000;
    return new Date(millis);
}
exports.fromTimestamp = fromTimestamp;
const timestampFromJSON = (object) => {
    return {
        seconds: isSet(object.seconds)
            ? BigInt(object.seconds.toString())
            : BigInt(0),
        nanos: isSet(object.nanos) ? Number(object.nanos) : 0
    };
};
function fromJsonTimestamp(o) {
    if (o instanceof Date) {
        return toTimestamp(o);
    }
    else if (typeof o === 'string') {
        return toTimestamp(new Date(o));
    }
    else {
        return timestampFromJSON(o);
    }
}
exports.fromJsonTimestamp = fromJsonTimestamp;
function numberToLong(number) {
    return BigInt(Math.trunc(number));
}
