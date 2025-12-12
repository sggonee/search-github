import { test as base, expect, type Page } from '@playwright/test';
import { mockUsers } from './data/users';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

type Fixtures = {
  page: Page;
  gotoHome: () => Promise<void>;
  gotoSearchResults: (q: string) => Promise<void>;
  fillSearch: (q: string) => Promise<void>;
};

function installMockRoute(page: Page) {
  // 중복 설치 방지(테스트가 여러 helper를 호출해도 안전하게)
  page.unroute('**/api/github/search-users**').catch(() => undefined);

  return page.route('**/api/github/search-users**', async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') ?? '';
    const tokens = q.trim().split(/\s+/).filter(Boolean);

    const hasToken = (t: string) => tokens.includes(t);
    const isUserOnly = hasToken('type:user');
    const isOrgOnly = hasToken('type:org');

    // `in:` filters (default: login)
    const inLogin = hasToken('in:login');
    const inName = hasToken('in:name');
    const inEmail = hasToken('in:email');

    // Treat the first non-qualifier token as keyword
    // (qualifier examples: type:org, in:login, location:..., language:...)
    const keyword = tokens.find((t) => !t.includes(':')) ?? '';

    const matchText = (value: unknown) => {
      if (!keyword) return true;
      if (typeof value !== 'string') return false;
      return value.toLowerCase().includes(keyword.toLowerCase());
    };

    const matchByInFilter = (u: any) => {
      // if no `in:` specified, default behavior: login
      if (!inLogin && !inName && !inEmail) return matchText(u.login);

      const hits: boolean[] = [];
      if (inLogin) hits.push(matchText(u.login));
      if (inName) hits.push(matchText(u.name));
      if (inEmail) hits.push(matchText(u.email));
      return hits.some(Boolean);
    };

    const items = mockUsers.filter((u: any) => {
      if (isUserOnly && u.type !== 'User') return false;
      if (isOrgOnly && u.type !== 'Organization') return false;
      return matchByInFilter(u);
    });

    await route.fulfill({
      status: 200,
      json: {
        total_count: items.length,
        incomplete_results: false,
        items,
      },
    });
  });
}

async function gotoWithMock(page: Page, path: string) {
  await installMockRoute(page);
  await page.goto(`${BASE_URL}${path}`);
}

export const test = base.extend<Fixtures>({
  gotoHome: async ({ page }, use) => {
    await use(async () => {
      // ✅ 최종 결과물 HTML이 /github/search-users 페이지에서 렌더링되는 상태라면
      await gotoWithMock(page, '/github/search-users?q=kevin');

      await expect(page.getByRole('heading', { name: /GitHub 사용자 검색/ })).toBeVisible();
      await expect(page.locator('input[name="q"]')).toBeVisible();
    });
  },

  gotoSearchResults: async ({ page }, use) => {
    await use(async (q: string) => {
      await gotoWithMock(page, `/github/search-users?q=${encodeURIComponent(q)}`);
      await expect(page).toHaveURL(/\/github\/search-users\?q=/);
    });
  },

  fillSearch: async ({ page }, use) => {
    await use(async (q: string) => {
      await installMockRoute(page);
      const input = page.locator('input[name="q"]');
      await input.fill(q);

      // ✅ 최종 HTML: type=submit + aria-label="검색"
      await page.getByRole('button', { name: '검색' }).click();
      await expect(page).toHaveURL(/\/github\/search-users\?q=/);
    });
  },
});

export { expect };
