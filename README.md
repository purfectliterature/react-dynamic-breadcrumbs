<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/4ec9c369-de94-4f0d-9113-8a1ba93d38bf">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/463d37e3-c85f-4a54-a768-0f9ac223a685">
    <img width="500" alt="react-dynamic-breadcrumbs logo" src="https://github.com/user-attachments/assets/463d37e3-c85f-4a54-a768-0f9ac223a685">
  </picture>
</p>

<h1 align="center">
  react-dynamic-breadcrumbs
</h1>

<div align="center">
  <p>
   A fast, small, headless hook for generating truly dynamic breadcrumbs in React, decoupled from your routing structure.
  </p>

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/purfectliterature/react-dynamic-breadcrumbs/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/purfectliterature/react-dynamic-breadcrumbs/tree/master) ![npm](https://img.shields.io/npm/v/react-dynamic-breadcrumbs)

![Sequence 01](https://github.com/user-attachments/assets/48d66dad-fd12-4f97-9ec9-b11480f78202)

<sup>(The crumbs were loading here because they are being fetched from the server, not because the rendering is slow.)</sup>

</div>

## Motivation

This hook was first shipped to production on [Coursemology in 2023 when I was migrating its front-end to React](https://github.com/Coursemology/coursemology2/pull/6100). Since the front-end is a standalone single-page application, the pages wouldn't know its relative position in the whole site. Classic solutions, like in other breadcrumbs library, of each page rendering its own breadcrumbs, are not feasible for our use case.

```jsx
const AssessmentsPage = () => {
  return (
    <div>
      <BreadcrumbItem>Assessments</BreadcrumbItem>
      ...
    </div>
  );
};
```

This is perfect for static breadcrumbs, but not for dynamic ones. This is also perfect for sites where the URL structure matches the routing structure, hence the breadcrumb structure. But in my migrated site case, the URL structure _differs_ a lot from the routing structure. Even worse, the breadcrumb structure also differs from the routing (and hence, URL) structures. Here's an example.

| URL                             | Breadcrumbs                                           |
| ------------------------------- | ----------------------------------------------------- |
| `/assessments`                  | Assessments                                           |
| `/assessments?category=1`       | Assessments / Category 1                              |
| `/assessments?category=1&tab=2` | Assessments / Category 1 / Tab 2                      |
| `/assessments/1`                | Assessments / Category 1 / Assessment 1               |
| `/assessments/1/submissions`    | Assessments / Category 1 / Assessment 1 / Submissions |
| `/assessments/submissions`      | All submissions                                       |
| `/assessments/skills`           | Skills                                                |

This is crazy! This is not a result of "bad engineering". It's just how our site's structured in Rails, and we have to maintain these URL structures for backward compatibility.

A common example is files and folders. They are structured as trees in the database, but this means that the URL structure won't reflect the tree structure.

| URL          | Breadcrumbs                     |
| ------------ | ------------------------------- |
| `/folders/1` | Folder 1                        |
| `/folders/2` | Folder 1 / Subfolder 1          |
| `/files/1`   | Folder 1 / Subfolder 1 / File 1 |

This is a totally possible structure, given that files and folders are basically nodes of the whole app's folder tree. You can probably see how the "classic solutions" for dynamic breadcrumbs just won't work for these structures. SSR apps, especially with outside-in routing, can always generate the breadcrumbs just before responding to the browser as they have the full context of the request, but not so much for CSR or SPA apps.

That's why I created this library. It _decouples_ the breadcrumbs structure from the URL or routing structures and any pages in your app, allowing you to generate truly dynamic breadcrumbs.

## Getting started

```bash
npm i react-dynamic-breadcrumbs
```

```bash
yarn add react-dynamic-breadcrumbs
```

```bash
pnpm add react-dynamic-breadcrumbs
```

### With React Router 6.4+

Define your handles in your router.

```jsx
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppContainer />,
    handle: "Home",
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
        handle: "Products",
        children: [
          {
            path: ":productId",
            element: <ProductPage />,
            handle: (match) => {
              const productId = match.params.productId;

              return {
                getData: async () => {
                  const product = await fetchProduct(productId);

                  return {
                    title: product.name,
                    url: `/products/${productId}`,
                  };
                },
              };
            },
          },
        ],
      },
    ],
  },
]);
```

Then, render the breadcrumbs in your app.

```jsx
import { useMatches } from "react-router-dom";
import { DynamicBreadcrumbsProvider } from "react-dynamic-breadcrumbs";

const Breadcrumbs = () => {
  const matches = useMatches();
  const { crumbs } = useDynamicBreadcrumbs({ matches });

  return (
    <nav>
      {crumbs.map((crumb, index) => (
        <span key={index}>
          <Link to={crumb.url}>{crumb.title}</Link>
          {index < crumbs.length - 1 && " / "}
        </span>
      ))}
    </nav>
  );
};
```

### Without React Router

This library doesn't require any specific routing library; all it needs is just React. You just need to provide `useDynamicBreadcrumbs` with the `matches` array. The `Match` type is exported for your convenience.

```jsx
import { useDynamicBreadcrumbs } from "react-dynamic-breadcrumbs";

const Breadcrumbs = () => {
  // Your custom logic to get the matches for the current route
  const routes = useCurrentRoutes();

  const { crumbs } = useDynamicBreadcrumbs({
    matches: routes.map((route) => ({
      id: route.id,
      pathname: route.pathname,
      handle: route.handle,
    })),
  });

  return (
    <nav>
      {crumbs.map((crumb, index) => (
        <span key={index}>
          <Link to={crumb.url}>{crumb.title}</Link>
          {index < crumbs.length - 1 && " / "}
        </span>
      ))}
    </nav>
  );
};
```

The `match` object that the handles receive is the same as the one that `useDynamicBreadcrumbs` receives, so you dictate the information flow. This library only manages the crumbs state for you and doesn't assume anything about your per-crumb data structure.

## Concepts

There are two places where this library powers: your breadcrumbs component with `useDynamicBreadcrumbs`, and the handles. The handles are loosely tied to the routes in your app. The breadcrumbs component will collect all the handles that match the current route structure, pass it to `useDynamicBreadcrumbs`, and render the crumbs.

### Handles

This terminology is borrowed from [React Router's handles](https://reactrouter.com/6.30.0/hooks/use-matches), which is essentially something you can tie to a route object (as the `handle` key) in your router object. In this library, handles are responsible for rendering the crumb(s) for a route _and_ routes nested under it. There are two kinds of handles: static and data handlers.

A static handle is just a plain data that you can directly use to render its crumb. It can be a string or an object, e.g., translated string object.

```js
const handle = "Home";
```

```js
const handle = {
  defaultMessage: "Home",
  description: "The home page",
};
```

The power of this library is in the data handlers. They are functions that return an object that influence the crumb's rendering.

You can return a crumb data, similar to the static handle. In this example, we see it supports returning a string or any object.

```ts
const handle: DataHandle = (match) => {
  if (match.pathname.includes("/admin")) {
    return "Admin";
  }

  return {
    defaultMessage: "Home",
    description: "The home page",
  };
};
```

Or you can return a special _request object_ that influences the rendering of the crumb. This is the crux of the data handles.

```ts
const handle: DataHandle = (match) => {
  return {
    getData: () => ({
      content: {
        title: "Home",
        url: "/",
      },
    }),
  };
};
```

It also support promises.

```ts
const handle: DataHandle = (match) => {
  return {
    getData: async () => {
      const data = await fetchData(match.pathname);

      return {
        content: {
          title: data.title,
          url: data.url,
        },
      };
    },
  };
};
```

The `loading` key returned by `useDynamicBreadcrumbs` will become `true` if there are pending promises.

### Contexts

The `match` object passed to the data handler is the same as the one passed to `useDynamicBreadcrumbs`. You can add anything you want to it, as long as you fulfill the exported `Match` type, which requires at least `id`, `pathname`, and `handle`.

You can also pass your own context object to the handles.

```ts
const Breadcrumbs = () => {
  const matches = useMatches();

  const context: YourContext = {
    user: {
      name: "John Doe",
    },
  };

  const { crumbs } = useDynamicBreadcrumbs({ matches, context });

  return ...;
}
```

Then you can access it in the handle.

```ts
const handle: DataHandle<YourContext> = (match, context) => {
  return `${context.user.name}'s profile`;
};
```

Since we don't care what `context` is, you can also set a function as the context if you need it.

### Active path

This library also helps you track the current active path, in case you need it to highlight some currently active sidebar items or tabs or something.

```ts
const handle: DataHandle = (match) => {
  return {
    getData: () => ({
      activePath: "/portfolio",
      content: {
        title: "Products",
        url: "/products",
      },
    }),
  };
};
```

```ts
const Breadcrumbs = () => {
  const matches = useMatches();
  const { crumbs, activePath } = useDynamicBreadcrumbs({ matches });

  return ...;
}
```

> [!NOTE]
> Why do you need this? Maybe your sidebar's items have different keys from the breadcrumbs' pathnames? See, decoupled!

### Caching

The `useDynamicBreadcrumbs` hook caches the crumbs that are still valid for the current route structure. Valid crumbs are crumbs whose handle (or match) still exists in the correct position in the current route structure, i.e., in `matches`.

This means that if you navigate forwards in the breadcrumbs structure, the hook will only call the handles for the _incoming_ crumbs. If you navigate backwards, the hook will just pop the outgoing crumbs. All these, without losing the crumbs that are still valid, hence no re-invocations of these crumbs' handles. This is important if your handles are expensive to compute, e.g., requires fetching data from the server.

If there are pending incoming crumbs, the `loading` key returned by `useDynamicBreadcrumbs` will become `true`, _and `crumbs` will always be the valid cached crumbs_. This means you can simply render a loading indicator, if you want, at the end of the breadcrumbs component. And the user will see as much of the breadcrumbs as possible, even if the incoming crumbs are still loading. It's a tight caching.

```jsx
const Breadcrumbs = () => {
  const matches = useMatches();
  const { crumbs, loading } = useDynamicBreadcrumbs({ matches });

  return (
    <nav>
      {crumbs.map((crumb, index) => (
        <span key={index}>
          <Link to={crumb.url}>{crumb.title}</Link>
          {index < crumbs.length - 1 && " / "}
        </span>
      ))}

      {loading && <LoadingIndicator />}
    </nav>
  );
};
```

If you explicitly don't want certain parts of the crumbs to be cached, and need it to always be revalidated, you can use `shouldRevalidate` in the data handle.

```ts
const handle: DataHandle = (match) => {
  return {
    shouldRevalidate: true,
    getData: async () => {
      const data = await fetchData(match.id);

      return {
        content: {
          title: data.title,
          url: data.url,
        },
      };
    },
  };
};
```

This ensures that this crumb's handle will always be re-invoked when the crumbs are re-rendered. If this crumb's match still exists in `matches`, when `loading` is `true`, `crumbs` will still contain this crumb's last data. Once `loading` is `false`, it will be the latest data, along with other new crumbs.

### Nested crumbs

A handle can add multiple crumbs to the breadcrumbs structure. Simply return an array of crumb contents in a data handle.

```ts
const handle: DataHandle = (match) => {
  return {
    getData: async () => {
      const folder = await fetchFolder(match.id);

      return {
        content: folder.paths.map((path) => ({
          title: path.name,
          url: path.url,
        })),
      };
    },
  };
};
```

> [!NOTE]
> Know that `crumbs` returned by `useDynamicBreadcrumbs` _won't be flattened_ for you. If you want to render all the crumbs as one flat list, you can use the `forEachFlatCrumb` utility.
>
> ```jsx
> import {
>   forEachFlatCrumb,
>   useDynamicBreadcrumbs,
> } from "react-dynamic-breadcrumbs";
>
> const Breadcrumbs = () => {
>   const matches = useMatches();
>   const { crumbs } = useDynamicBreadcrumbs({ matches });
>
>   const elements = [];
>
>   forEachFlatCrumb(crumbs, (crumb, isLast, key) => {
>     elements.push(
>       <span key={key}>
>         <Link to={crumb.url}>{crumb.title}</Link>
>         {!isLast && " / "}
>       </span>
>     );
>   });
>
>   return <nav>{elements}</nav>;
> };
> ```

### Overriding crumbs

Crumbs and handles should always move forward in the breadcrumbs structure. This means that handles can only provide crumbs for the current route and its children. It can't affect any crumbs that are matched before it. This is by design, and ensures that the breadcrumbs structure, i.e., where you place the handles and how you understand these handles are resolved, is always consistent and predictable.

If you need to have vastly different breadcrumbs structures for different routes, consider placing one data handle at the [lowest common ancestor](https://en.wikipedia.org/wiki/Lowest_common_ancestor) of these routes. This handle can then return different crumbs based on the current route. Examples are provided below.

## Examples

The examples here are taken from [Coursemology](https://github.com/Coursemology/coursemology2)'s front-end code where this library was first used. These examples are simplified for demonstration purposes, but will show you why this library is powerful, and other classic solutions just won't work.

### From search params

| URL                             | Breadcrumbs                              |
| ------------------------------- | ---------------------------------------- |
| `/assessments`                  | Category 1 / Tab 1                       |
| `/assessments?category=1`       | Category 1 / Tab 1                       |
| `/assessments?category=1&tab=2` | Category 1 / Tab 2                       |
| `/assessments/1`                | Category 1 / Tab 1 / Assessment 1        |
| `/assessments/2`                | Category 2 / Tab 1 / Assessment 2        |
| `/assessments/2/edit`           | Category 2 / Tab 1 / Assessment 2 / Edit |
| `/assessments/skills`           | Skills                                   |
| `/assessments/submissions`      | Submissions                              |

In this example, "Category 1" and "Tab 1" are the defaults, hence they are shown when their own identifiers aren't present in the URL structure.

```jsx
const router = [
  {
    path: "assessments",
    handle: (match, location) => {
      if (location.pathname.includes("assessments/s")) return null;

      let promise;

      const assessmentId = match.params?.assessmentId;

      if (assessmentId) {
        promise = getTabTitleFromAssessmentId(assessmentId);
      } else {
        const searchParams = new URLSearchParams(location.search);
        const categoryId = getIdFromUnknown(searchParams.get("category"));
        const tabId = getIdFromUnknown(searchParams.get("tab"));
        promise = getTabTitle(categoryId, tabId);
      }

      return {
        shouldRevalidate: true,
        getData: async () => {
          const result = await promise;

          return {
            activePath: data.tabId,
            content: {
              title: result.title,
              url: result.url,
            },
          };
        },
      };
    },
    children: [
      {
        index: true,
        element: <AssessmentsPage />,
      },
      {
        path: "submissions",
        element: <SubmissionsPage />,
        handle: "All submissions",
      },
      {
        path: "skills",
        element: <SkillsPage />,
        handle: "Skills",
      },
      {
        path: ":assessmentId",
        handle: (match) => {
          const assessmentId = match.params?.assessmentId;
          invariant(assessmentId);

          return {
            getData: async () => {
              const data = await fetchAssessment(assessmentId);
              return data.title;
            },
          };
        },
        children: [
          {
            index: true,
            element: <AssessmentPage />,
          },
          {
            path: "edit",
            element: <EditAssessmentPage />,
            handle: "Edit",
          },
        ],
      },
    ],
  },
];
```

### Nested crumbs

| URL          | Breadcrumbs                    |
| ------------ | ------------------------------ |
| `/folders/1` | Folder 1                       |
| `/folders/2` | Folder 1 / Folder 1            |
| `/folders/3` | Folder 1 / Folder 2            |
| `/folders/4` | Folder 2 / Folder 8 / Folder 3 |

```jsx
const router = [
  {
    path: "folders",
    handle: (match) => {
      const folderId = match.params?.folderId;
      invariant(folderId);

      return {
        shouldRevalidate: true,
        getData: async () => {
          try {
            const folder = await fetchFolder(folderId);

            return {
              activePath: folder.rootFolderId,
              content: folder.paths.map((path) => ({
                title: path.name,
                url: path.url,
              })),
            };
          } catch (error) {
            const crumbs = error.response.paths.map((path) => ({
              title: path.name,
              url: path.url,
            }));

            return {
              activePath: error.response.rootFolderId,
              content: crumbs.concat({
                title: "Folder Not Found",
              }),
            };
          }
        },
      };
    },
    children: [
      {
        path: ":folderId",
        children: [
          {
            index: true,
            element: <FolderPage />,
          },
        ],
      },
    ],
  },
];
```

In this example, `fetchFolder` is a function that fetches the folder's paths from the server. If the folder is not found, the server will return the furthest path it can find. We then append a "Folder Not Found" crumb to the end of the breadcrumbs.

`shouldRevalidate` is set to `true` here because there's a sidebar whose sidebar item for "Folders" is keyed by `rootFolderId`. If we define the data handle on the `:folderId` route, then every time the user navigates to a new folder, the match will disappear from `matches` since the `:folderId` route is changed. This will cause the "Folders" sidebar item's active appearance to flicker since `activePath` will be `undefined` while the new folder is fetching. Hence,

1. we define the handle on the `folders` route, which is always stable for all URLs that look like `/folders/1`, so that its crumb (and `activePath`) is always present in `crumbs`, and
2. set `shouldRevalidate` to `true` so that the handle fetches the incoming folder's paths correctly.

This is such an edge use case; how cool is that?
