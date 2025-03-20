import { isPromise, isRecord } from "./utils";

describe("isRecord", () => {
  it("returns true if the value is a key-value pair", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ key: "value" })).toBe(true);
  });

  it("returns false if the value is an array", () => {
    expect(isRecord([])).toBe(false);
  });

  it("returns false if the value is null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false if the value is undefined", () => {
    expect(isRecord(undefined)).toBe(false);
  });

  it("returns false if the value is a symbol", () => {
    expect(isRecord(Symbol())).toBe(false);
  });

  it("returns false if the value is a class instance", () => {
    expect(isRecord(new Date())).toBe(false);
    expect(isRecord(new Error())).toBe(false);
    expect(isRecord(new Map())).toBe(false);
    expect(isRecord(new Set())).toBe(false);
  });

  it("returns false if the value is a string", () => {
    expect(isRecord("")).toBe(false);
  });
});

describe("isPromise", () => {
  it("returns true if the value is a Promise", () => {
    expect(isPromise(new Promise(() => {}))).toBe(true);
    expect(isPromise(Promise.resolve())).toBe(true);
    expect(isPromise((async () => {})())).toBe(true);
  });

  it("returns false if the value is an object", () => {
    expect(isPromise({})).toBe(false);
    expect(isPromise({ then: true })).toBe(false);
  });

  it("returns false if the value is a string", () => {
    expect(isPromise("")).toBe(false);
  });

  it("returns false if the value is a number", () => {
    expect(isPromise(0)).toBe(false);
    expect(isPromise(2)).toBe(false);
  });

  it("returns false if the value is a boolean", () => {
    expect(isPromise(true)).toBe(false);
  });

  it("returns false if the value is a function", () => {
    expect(isPromise(() => {})).toBe(false);
    expect(isPromise(function () {})).toBe(false);
    expect(isPromise(new Function())).toBe(false);
  });

  it("returns false if the value is null", () => {
    expect(isPromise(null)).toBe(false);
  });

  it("returns false if the value is undefined", () => {
    expect(isPromise(undefined)).toBe(false);
  });

  it("returns false if the value is an array", () => {
    expect(isPromise([])).toBe(false);
  });

  it("returns false if the value is a symbol", () => {
    expect(isPromise(Symbol())).toBe(false);
  });

  it("returns false if the value is a bigint", () => {
    expect(isPromise(BigInt(0))).toBe(false);
    expect(isPromise(BigInt(2))).toBe(false);
  });

  it("returns false if the value is a class instance", () => {
    expect(isPromise(new Date())).toBe(false);
    expect(isPromise(new Error())).toBe(false);
    expect(isPromise(new Map())).toBe(false);
    expect(isPromise(new Set())).toBe(false);
  });
});
