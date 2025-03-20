import { forEachFlatCrumb, getLastCrumbTitle } from "./crumbs";

describe("getLastCrumbTitle", () => {
  it("returns the last crumb title", () => {
    expect(
      getLastCrumbTitle([
        {
          id: "home",
          pathname: "/",
          content: { title: "Home" },
        },
        {
          id: "products",
          pathname: "/products",
          content: { title: "Products" },
        },
      ])
    ).toBe("Products");
  });

  it("returns the last crumb title when the content is an array", () => {
    expect(
      getLastCrumbTitle([
        {
          id: "home",
          pathname: "/",
          content: { title: "Home" },
        },
        {
          id: "products",
          pathname: "/products",
          content: [{ title: "A" }, { title: "B" }],
        },
      ])
    ).toBe("B");
  });

  it("returns null if the last crumb has no content", () => {
    expect(
      getLastCrumbTitle([
        {
          id: "home",
          pathname: "/",
          content: { title: "Home" },
        },
        {
          id: "products",
          pathname: "/products",
        },
      ])
    ).toBe(null);
  });
});

describe("forEachFlatCrumb", () => {
  it("calls the callback for each crumb content", () => {
    const fn = vi.fn();

    forEachFlatCrumb(
      [
        {
          id: "home",
          pathname: "/",
          content: { title: "1" },
        },
        {
          id: "products",
          pathname: "/products",
          content: { title: "2" },
        },
      ],
      fn
    );

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, { title: "1" }, false, "/");
    expect(fn).toHaveBeenNthCalledWith(2, { title: "2" }, true, "/products");
  });

  it("calls the callback for each crumb content in nested crumbs", () => {
    const fn = vi.fn();

    forEachFlatCrumb(
      [
        {
          id: "home",
          pathname: "/",
          content: { title: "1" },
        },
        {
          id: "products",
          pathname: "/products",
          content: [{ title: "2" }, { title: "3" }],
        },
      ],
      fn
    );

    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenNthCalledWith(1, { title: "1" }, false, "/");
    expect(fn).toHaveBeenNthCalledWith(2, { title: "2" }, false, "/products-0");
    expect(fn).toHaveBeenNthCalledWith(3, { title: "3" }, true, "/products-1");
  });

  it("does not call the callback if the crumb has no content", () => {
    const fn = vi.fn();

    forEachFlatCrumb(
      [
        {
          id: "home",
          pathname: "/",
          content: { title: "1" },
        },
        {
          id: "products",
          pathname: "/products",
        },
        {
          id: "about",
          pathname: "/about",
          content: { title: "2" },
        },
      ],
      fn
    );

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, { title: "1" }, false, "/");
    expect(fn).toHaveBeenNthCalledWith(2, { title: "2" }, true, "/about");
  });
});
