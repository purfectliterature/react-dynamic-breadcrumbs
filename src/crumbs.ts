import { produce } from "immer";

import { isRecord, Match } from "./utils";

export interface CrumbContent<TValue = unknown> {
  url?: string;
  title?: TValue;
}

export interface CrumbData<TValue = unknown> {
  id: string;
  pathname: string;
  activePath?: string | null;
  content?: CrumbContent<TValue> | CrumbContent<TValue>[];
}

export interface CrumbPath<TValue = unknown> {
  pathname?: string;
  activePath?: string | null;
  content?: CrumbContent<TValue> | CrumbContent<TValue>[];
}

export type CrumbState = Record<string, CrumbData>;

/**
 * Returns the title of the last `CrumbContent` in `crumbs`.
 */
export const getLastCrumbTitle = <TValue = unknown>(
  crumbs: CrumbData<TValue>[]
): TValue | null | undefined => {
  const content = crumbs[crumbs.length - 1]?.content;
  if (!content) return null;

  const actualContent = Array.isArray(content)
    ? content[content.length - 1]
    : content;
  if (!actualContent) return null;

  return actualContent.title;
};

/**
 * Calls `callback` for each `CrumbContent` in `crumbs`, even nested ones.
 *
 * `key` in `callback`'s arguments is a unique identifier for each crumb content
 * as convenience for you to render the individual crumbs. Use it purely as a
 * stable, unique identifier and don't rely on its actual value.
 */
export const forEachFlatCrumb = <TValue = unknown>(
  crumbs: CrumbData<TValue>[],
  callback: (crumb: CrumbContent<TValue>, isLast: boolean, key: string) => void
): void =>
  crumbs.forEach((crumb, index) => {
    const content = crumb.content;
    if (!content) return;

    const isLastCrumb = index >= crumbs.length - 1;

    if (Array.isArray(content)) {
      content.forEach((item, itemIndex) => {
        const isLastItem = isLastCrumb && itemIndex >= content.length - 1;
        callback(item, isLastItem, `${crumb.pathname}-${itemIndex}`);
      });
    } else {
      callback(content, isLastCrumb, crumb.pathname);
    }
  });

export const isCrumbPath = (value: unknown): value is CrumbPath =>
  isRecord(value) && "content" in value;

export const buildCrumbData = <TContext, TValue = unknown>(
  match: Match<TContext>,
  data: TValue | CrumbPath<TValue>
): CrumbData => ({
  id: match.id,
  pathname: match.pathname,
  ...(isCrumbPath(data)
    ? data
    : {
        content: {
          title: data,
          url: match.pathname,
        },
      }),
});

export const combineCrumbs = (
  delta: CrumbData[]
): ((state: CrumbState) => CrumbState) =>
  produce((draft) => {
    delta.forEach((crumb) => {
      draft[crumb.pathname] = crumb;
    });
  });
