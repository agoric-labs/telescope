export function isSet(value) {
    return value !== null && value !== undefined;
}
export function toTimestamp(date) {
    const seconds = numberToLong(date.getTime() / 1_000);
    const nanos = (date.getTime() % 1000) * 1000000;
    return {
        seconds,
        nanos
    };
}
export function fromTimestamp(t) {
    let millis = Number(t.seconds) * 1000;
    millis += t.nanos / 1000000;
    return new Date(millis);
}
const timestampFromJSON = (object) => {
    return {
        seconds: isSet(object.seconds)
            ? BigInt(object.seconds.toString())
            : BigInt(0),
        nanos: isSet(object.nanos) ? Number(object.nanos) : 0
    };
};
export function fromJsonTimestamp(o) {
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
function numberToLong(number) {
    return BigInt(Math.trunc(number));
}
