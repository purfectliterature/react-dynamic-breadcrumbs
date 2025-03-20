import { DataHandle } from "./handles";

export type Promisable<T> = T | Promise<T>;

export interface Match<TContext = undefined, TValue = unknown> {
  id: string;
  pathname: string;
  handle?: TValue | DataHandle<TContext, Match<TContext>, TValue>;
}

export const isRecord = <K extends string | number | symbol, V>(
  value: unknown
): value is Record<K, V> =>
  typeof value === "object" &&
  value !== null &&
  Object.getPrototypeOf(value) === Object.prototype &&
  !Array.isArray(value);

export const isPromise = <T>(value: unknown): value is Promise<T> =>
  typeof value === "object" &&
  value !== null &&
  "then" in value &&
  typeof value.then === "function";
