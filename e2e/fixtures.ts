import { test as base, expect, type Page } from '@playwright/test';
import { mockUsers } from './data/users';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http:localhost:${PORT}`;

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

    const items = mockUsers.filter((u) => {
      if (isUserOnly) return u.type === 'User';
      if (isOrgOnly) return u.type === 'Organization';
      return true;
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_count: items.length,
        incomplete_results: false,
        items,
      }),
    });
  });
}

export const test = base.extend<Fixtures>({
  gotoHome: async ({ page }, use) => {
    await use(async () => {
      await installMockRoute(page);

      // ✅ 최종 결과물 HTML이 /github/search-users 페이지에서 렌더링되는 상태라면
      await page.goto(`${BASE_URL}/github/search-users?q=kevin`);

      await expect(page.getByRole('heading', { name: /GitHub 사용자 검색/ })).toBeVisible();
      await expect(page.locator('input[name="q"]')).toBeVisible();
    });
  },

  gotoSearchResults: async ({ page }, use) => {
    await use(async (q: string) => {
      await installMockRoute(page);
      await page.goto(`${BASE_URL}/github/search-users?q=${encodeURIComponent(q)}`);
      await expect(page).toHaveURL(/\/github\/search-users\?q=/);
    });
  },

  fillSearch: async ({ page }, use) => {
    await use(async (q: string) => {
      const input = page.locator('input[name="q"]');
      await input.fill(q);

      // ✅ 최종 HTML: type=submit + aria-label="검색"
      await page.getByRole('button', { name: '검색' }).click();
      await expect(page).toHaveURL(/\/github\/search-users\?q=/);
    });
  },
});

export { expect };
