import { act, renderHook } from "@testing-library/react";
import useDynamicBreadcrumbs from "./use-dynamic-breadcrumbs";
import { CrumbData } from "./crumbs";
import { Match } from "./utils";
import { useState } from "react";

const fetchData = <T>(data: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), 1000);
  });

const FETCH_DATA_DELAY_MS = 1000;

const HOME_CRUMB_DATA: CrumbData = {
  id: "home",
  pathname: "/",
  content: { title: "Home", url: "/" },
};

const PRODUCTS_CRUMB_DATA: CrumbData = {
  id: "products",
  pathname: "/products",
  content: { title: "Products", url: "/products" },
};

describe("useDynamicBreadcrumbs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the crumbs", () => {
    const { result } = renderHook(() =>
      useDynamicBreadcrumbs({
        matches: [{ id: "home", pathname: "/", handle: "Home" }],
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.crumbs).toEqual([HOME_CRUMB_DATA]);
  });

  it("returns loading when there are promises", async () => {
    const { result } = renderHook(() =>
      useDynamicBreadcrumbs({
        matches: [
          {
            id: "home",
            pathname: "/",
            handle: "Home",
          },
          {
            id: "products",
            pathname: "/products",
            handle: () => ({
              getData: () =>
                fetchData({ content: { title: "Products", url: "/products" } }),
            }),
          },
        ],
      })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.crumbs).toEqual([]);

    await act(() => vi.advanceTimersByTime(FETCH_DATA_DELAY_MS));

    expect(result.current.loading).toBe(false);
    expect(result.current.crumbs).toEqual([
      HOME_CRUMB_DATA,
      PRODUCTS_CRUMB_DATA,
    ]);
  });

  it("returns the active path of the last crumb with truthy content", () => {
    const { result } = renderHook(() =>
      useDynamicBreadcrumbs({
        matches: [
          {
            id: "home",
            pathname: "/",
            handle: () => ({
              getData: () => ({
                activePath: "/home",
                content: { title: "Home" },
              }),
            }),
          },
          {
            id: "products",
            pathname: "/products",
            handle: () => ({
              getData: () => ({
                activePath: "/products",
                content: { title: "Products" },
              }),
            }),
          },
          {
            id: "ignored",
            pathname: "/ignored",
            handle: () => ({
              getData: () => ({ activePath: "/ignored" }),
            }),
          },
        ],
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.activePath).toBe("/products");
  });

  it('returns no active path if the last crumb with truthy content has a null "activePath"', () => {
    const { result } = renderHook(() =>
      useDynamicBreadcrumbs({
        matches: [
          {
            id: "home",
            pathname: "/",
            handle: () => ({
              getData: () => ({
                activePath: "/home",
                content: { title: "Home" },
              }),
            }),
          },
          {
            id: "products",
            pathname: "/products",
            handle: () => ({
              getData: () => ({
                activePath: null,
                content: { title: "Products" },
              }),
            }),
          },
          {
            id: "ignored",
            pathname: "/ignored",
            handle: () => ({
              getData: () => ({ activePath: "/ignored" }),
            }),
          },
        ],
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.activePath).toBe("");
  });

  it("returns array of crumbs from data handlers", () => {
    const { result } = renderHook(() =>
      useDynamicBreadcrumbs({
        matches: [
          {
            id: "products",
            pathname: "/products",
            handle: () => ({
              getData: () => ({
                content: [
                  { title: "A", url: "/a" },
                  { title: "B", url: "/b" },
                ],
              }),
            }),
          },
        ],
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.crumbs).toEqual([
      {
        id: "products",
        pathname: "/products",
        content: [
          { title: "A", url: "/a" },
          { title: "B", url: "/b" },
        ],
      },
    ] satisfies CrumbData[]);
  });

  it("provides context to data handlers", () => {
    const { result } = renderHook(() =>
      useDynamicBreadcrumbs({
        matches: [
          {
            id: "home",
            pathname: "/",
            handle: (_, context) => ({
              getData: () => ({
                content: { title: context(), url: "/" },
              }),
            }),
          },
        ],
        context: () => "Home",
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.crumbs).toEqual([HOME_CRUMB_DATA]);
  });

  it("caches previous crumbs", async () => {
    const homeSpy = vi.fn();

    const { result } = renderHook(() => {
      const [matches, setMatches] = useState<Match[]>([
        {
          id: "home",
          pathname: "/",
          handle: () => ({
            getData: () => {
              homeSpy();
              return fetchData({ content: { title: "Home", url: "/" } });
            },
          }),
        },
      ]);

      const breadcrumbs = useDynamicBreadcrumbs({ matches });

      return { breadcrumbs, setMatches };
    });

    expect(result.current.breadcrumbs.loading).toBe(true);
    expect(result.current.breadcrumbs.crumbs).toEqual([]);

    await act(() => vi.advanceTimersByTime(FETCH_DATA_DELAY_MS));

    expect(result.current.breadcrumbs.loading).toBe(false);
    expect(result.current.breadcrumbs.crumbs).toEqual([HOME_CRUMB_DATA]);
    expect(homeSpy).toHaveBeenCalledTimes(1);

    await act(() => {
      result.current.setMatches((matches) => [
        ...matches,
        {
          id: "products",
          pathname: "/products",
          handle: () => ({
            getData: () =>
              fetchData({ content: { title: "Products", url: "/products" } }),
          }),
        },
      ]);
    });

    expect(result.current.breadcrumbs.loading).toBe(true);
    expect(result.current.breadcrumbs.crumbs).toEqual([HOME_CRUMB_DATA]);
    expect(homeSpy).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTime(FETCH_DATA_DELAY_MS));

    expect(result.current.breadcrumbs.loading).toBe(false);
    expect(result.current.breadcrumbs.crumbs).toEqual([
      HOME_CRUMB_DATA,
      PRODUCTS_CRUMB_DATA,
    ]);
    expect(homeSpy).toHaveBeenCalledTimes(1);

    await act(() => {
      result.current.setMatches(([home]) => [home]);
    });

    expect(result.current.breadcrumbs.loading).toBe(false);
    expect(result.current.breadcrumbs.crumbs).toEqual([HOME_CRUMB_DATA]);
    expect(homeSpy).toHaveBeenCalledTimes(1);
  });

  it('revalidates crumbs when "shouldRevalidate" is true', async () => {
    const homeSpy = vi.fn();

    const { result } = renderHook(() => {
      const [matches, setMatches] = useState<Match[]>([
        {
          id: "home",
          pathname: "/",
          handle: () => ({
            shouldRevalidate: true,
            getData: () => {
              homeSpy();
              return fetchData({ content: { title: "Home", url: "/" } });
            },
          }),
        },
      ]);

      const breadcrumbs = useDynamicBreadcrumbs({ matches });

      return { breadcrumbs, setMatches };
    });

    expect(result.current.breadcrumbs.loading).toBe(true);
    expect(result.current.breadcrumbs.crumbs).toEqual([]);

    await act(() => vi.advanceTimersByTime(FETCH_DATA_DELAY_MS));

    expect(result.current.breadcrumbs.loading).toBe(false);
    expect(result.current.breadcrumbs.crumbs).toEqual([HOME_CRUMB_DATA]);
    expect(homeSpy).toHaveBeenCalledTimes(1);

    await act(() => {
      result.current.setMatches((matches) => [
        ...matches,
        {
          id: "products",
          pathname: "/products",
          handle: () => ({
            getData: () =>
              fetchData({ content: { title: "Products", url: "/products" } }),
          }),
        },
      ]);
    });

    expect(result.current.breadcrumbs.loading).toBe(true);
    expect(result.current.breadcrumbs.crumbs).toEqual([HOME_CRUMB_DATA]);
    expect(homeSpy).toHaveBeenCalledTimes(2);

    await act(() => vi.advanceTimersByTime(FETCH_DATA_DELAY_MS));

    expect(result.current.breadcrumbs.loading).toBe(false);

    expect(result.current.breadcrumbs.crumbs).toEqual([
      HOME_CRUMB_DATA,
      PRODUCTS_CRUMB_DATA,
    ]);
    expect(homeSpy).toHaveBeenCalledTimes(2);

    await act(() => {
      result.current.setMatches(([home]) => [home]);
    });

    expect(result.current.breadcrumbs.loading).toBe(false);
    expect(result.current.breadcrumbs.crumbs).toEqual([HOME_CRUMB_DATA]);
    expect(homeSpy).toHaveBeenCalledTimes(3);
  });
});
