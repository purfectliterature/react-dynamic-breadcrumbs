import { CrumbPath } from "./crumbs";
import { isRecord, Match, Promisable } from "./utils";

interface HandleRequest<TValue = unknown> {
  shouldRevalidate?: boolean;
  getData: () => Promisable<TValue | CrumbPath<TValue>>;
}

type HandleData<TValue = unknown> = TValue | HandleRequest<TValue> | null;

export type DataHandle<
  TContext = undefined,
  TMatch extends Match<TContext> = Match<TContext>,
  TValue = unknown
> = (match: TMatch, context: TContext) => HandleData<TValue>;

export const isHandleRequest = (value: unknown): value is HandleRequest =>
  isRecord(value) && "getData" in value && typeof value.getData === "function";

export const getHandleData = <TContext>(
  match: Match<TContext>,
  context?: unknown
): HandleData => {
  const handle = match.handle;
  if (!handle) return null;

  return typeof handle === "function"
    ? handle(match, context as TContext)
    : handle;
};

export const getShouldRevalidateCrumb = (data: HandleData): boolean =>
  isHandleRequest(data) && (data.shouldRevalidate ?? false);

export const getHandleRequestData = (data: HandleData) =>
  isHandleRequest(data) ? data.getData() : data;
