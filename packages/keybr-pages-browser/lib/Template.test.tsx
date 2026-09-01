import { test } from "node:test";
import { FakeIntlProvider } from "@keybr/intl";
import { LoginPage } from "@keybr/page-account";
import { PageDataContext } from "@keybr/pages-shared";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { equal, isNotNull } from "rich-assert";
import { Template } from "./Template.tsx";

test("render", () => {
  const r = render(
    <PageDataContext.Provider
      value={{
        base: "https://www.keybr.com/",
        locale: "en",
        user: null,
        publicUser: {
          id: null,
          name: "name",
          imageUrl: null,
        },
        settings: null,
      }}
    >
      <FakeIntlProvider>
        <MemoryRouter>
          <Template path="/page">
            <div>hello</div>
          </Template>
        </MemoryRouter>
      </FakeIntlProvider>
    </PageDataContext.Provider>,
  );

  isNotNull(r.queryByText("hello"));

  r.unmount();
});

test("render alt", () => {
  const r = render(
    <PageDataContext.Provider
      value={{
        base: "https://www.keybr.com/",
        locale: "en",
        user: null,
        publicUser: {
          id: "abc",
          name: "name",
          imageUrl: null,
          premium: true,
        },
        settings: null,
      }}
    >
      <FakeIntlProvider>
        <MemoryRouter>
          <Template path="/page">
            <div>hello</div>
          </Template>
        </MemoryRouter>
      </FakeIntlProvider>
    </PageDataContext.Provider>,
  );

  isNotNull(r.queryByText("hello"));

  r.unmount();
});

test("render login page with one attribution footer", () => {
  const r = render(
    <PageDataContext.Provider
      value={{
        base: "https://www.keybr.com/",
        locale: "en",
        user: null,
        publicUser: {
          id: null,
          name: "name",
          imageUrl: null,
        },
        settings: null,
      }}
    >
      <FakeIntlProvider>
        <MemoryRouter>
          <Template path="/login">
            <LoginPage />
          </Template>
        </MemoryRouter>
      </FakeIntlProvider>
    </PageDataContext.Provider>,
  );

  equal(r.queryAllByText("Based on Keybr", { exact: false }).length, 1);

  r.unmount();
});
