import { test as base, expect, type Page } from '@playwright/test';
import { mockUsers } from './data/users';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

type Fixtures = {
  page: Page;
  gotoHome: () => Promise<void>;
  gotoSearchResults: (q: string) => Promise<void>;
  fillSearch: (q: string) => Promise<void>;
};

type MockUser = Record<string, any>;

type TokenCtx = {
  q: string;
  tokens: string[];
  hasToken: (t: string) => boolean;
  keyword: string;
};

function buildTokenCtx(q: string): TokenCtx {
  const tokens = q.trim().split(/\s+/).filter(Boolean);
  const hasToken = (t: string) => tokens.includes(t);
  const keyword = tokens.find((t) => !t.includes(':')) ?? '';
  return { q, tokens, hasToken, keyword };
}

function matchText(keyword: string, value: unknown) {
  if (!keyword) return true;
  if (typeof value !== 'string') return false;
  return value.toLowerCase().includes(keyword.toLowerCase());
}

function filterByType(ctx: TokenCtx) {
  const isUserOnly = ctx.hasToken('type:user');
  const isOrgOnly = ctx.hasToken('type:org');

  return (u: MockUser) => {
    if (isUserOnly && u.type !== 'User') return false;
    if (isOrgOnly && u.type !== 'Organization') return false;
    return true;
  };
}

function filterByIn(ctx: TokenCtx) {
  const inLogin = ctx.hasToken('in:login');
  const inName = ctx.hasToken('in:name');
  const inEmail = ctx.hasToken('in:email');
  const kw = ctx.keyword;

  return (u: MockUser) => {
    // `in:`이 없으면 login 기본
    if (!inLogin && !inName && !inEmail) return matchText(kw, u.login);

    const hits: boolean[] = [];
    if (inLogin) hits.push(matchText(kw, u.login));
    if (inName) hits.push(matchText(kw, u.name));
    if (inEmail) hits.push(matchText(kw, u.email));
    return hits.some(Boolean);
  };
}

function filterByReposRange(ctx: TokenCtx) {
  const token = ctx.tokens.find((t) => t.startsWith('repos:'));
  if (!token) return () => true;

  const m = token.slice('repos:'.length).match(/^(\d+)\.\.(\d+)$/);
  if (!m) return () => true;

  const min = Number.parseInt(m[1], 10);
  const max = Number.parseInt(m[2], 10);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return () => true;

  return (u: MockUser) => {
    const repos = typeof u.public_repos === 'number' ? u.public_repos : 0;
    return repos >= min && repos <= max;
  };
}

function composeFilters(...filters: Array<(u: MockUser) => boolean>) {
  return (u: MockUser) => filters.every((fn) => fn(u));
}

function installMockRoute(page: Page) {
  // 중복 설치 방지(테스트가 여러 helper를 호출해도 안전하게)
  page.unroute('**/api/github/search-users**').catch(() => undefined);

  return page.route('**/api/github/search-users**', async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') ?? '';

    const ctx = buildTokenCtx(q);

    const predicate = composeFilters(filterByType(ctx), filterByIn(ctx), filterByReposRange(ctx));

    const items = mockUsers.filter((u: any) => predicate(u));

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
