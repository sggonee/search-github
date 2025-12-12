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

function filterByFollowersRange(ctx: TokenCtx) {
  const token = ctx.tokens.find((t) => t.startsWith('followers:'));
  if (!token) return () => true;

  const m = token.slice('followers:'.length).match(/^(\d+)\.\.(\d+)$/);
  if (!m) return () => true;

  const min = Number.parseInt(m[1], 10);
  const max = Number.parseInt(m[2], 10);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return () => true;

  return (u: MockUser) => {
    const followers = typeof u.followers === 'number' ? u.followers : 0;
    return followers >= min && followers <= max;
  };
}

function filterByCreatedRange(ctx: TokenCtx) {
  const token = ctx.tokens.find((t) => t.startsWith('created:'));
  if (!token) return () => true;

  const raw = token.slice('created:'.length);
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/);
  if (!m) return () => true;

  const start = Date.parse(`${m[1]}T00:00:00.000Z`);
  const end = Date.parse(`${m[2]}T23:59:59.999Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return () => true;

  return (u: MockUser) => {
    const createdAt = typeof u.created_at === 'string' ? Date.parse(u.created_at) : NaN;
    if (!Number.isFinite(createdAt)) return false;
    return createdAt >= start && createdAt <= end;
  };
}

function filterByLocationLanguage(ctx: TokenCtx) {
  const locToken = ctx.tokens.find((t) => t.startsWith('location:'));
  const langToken = ctx.tokens.find((t) => t.startsWith('language:'));

  const loc = locToken ? locToken.slice('location:'.length).trim() : '';
  const lang = langToken ? langToken.slice('language:'.length).trim() : '';

  const includesCI = (needle: string, hay?: unknown) => {
    if (!needle) return true;
    if (typeof hay !== 'string' || !hay) return false;
    return hay.toLowerCase().includes(needle.toLowerCase());
  };

  return (u: MockUser) => {
    // NOTE: mockUsers에 location/language가 없는 경우가 있을 수 있어,
    //       값이 없으면 필터가 강제로 0건이 되지 않도록 '없으면 통과'로 둔다.
    //       (실서비스가 아니라 E2E mock 목적)
    if (locToken) {
      if (typeof u.location === 'string') {
        if (!includesCI(loc, u.location)) return false;
      }
    }

    if (langToken) {
      const field = (u.language ?? u.lang) as unknown;
      if (typeof field === 'string') {
        if (!includesCI(lang, field)) return false;
      }
    }

    return true;
  };
}

function filterBySponsors(ctx: TokenCtx) {
  const enabled = ctx.tokens.some((t) => t === 'sponsors:true' || t === 'sponsorable:true' || t === 'is:sponsorable');
  if (!enabled) return () => true;

  return (u: MockUser) => {
    // mockUsers에 필드가 없을 수 있어, 없으면 통과(테스트 안정성)
    const v = (u.sponsors ?? u.sponsorable) as unknown;
    if (typeof v !== 'boolean') return true;
    return v === true;
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

    const predicate = composeFilters(
      filterByType(ctx),
      filterByIn(ctx),
      filterByReposRange(ctx),
      filterByFollowersRange(ctx),
      filterByCreatedRange(ctx),
      filterByLocationLanguage(ctx),
      filterBySponsors(ctx),
    );

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
