import { expect, test } from '../fixtures';

type SearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{ sponsors?: boolean; sponsorable?: boolean }>;
};

function waitUsersResponse(page: any, predicate: (q: string) => boolean) {
  return page.waitForResponse((res: any) => {
    if (!res.url().includes('/api/github/search-users')) return false;
    if (res.request().method() !== 'GET') return false;

    const url = new URL(res.url());
    const q = url.searchParams.get('q') ?? '';
    return predicate(q);
  });
}

function finalizeQualifiersOnly(q: string) {
  return q
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.includes(':'))
    .join(' ');
}

// 실제 UI 토큰: is:sponsorable (또는 과거/대체 토큰)
const SPONSOR_TOKEN_RE = /(is:sponsorable|sponsors:true|sponsorable:true)/;
const SPONSOR_TOKEN_RE_EXACT = /^(is:sponsorable|sponsors:true|sponsorable:true)$/;

test.describe('Advanced filter — sponsors', () => {
  test('sponsors:true updates q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    // data-testid 우선, 없으면 텍스트 기반(유니크)
    const sponsorsBtn = page
      .locator('[data-testid="filter-sponsors"], [data-testid="filter-sponsorable"]')
      .first()
      .or(page.getByRole('button', { name: 'Sponsorable' }));

    // keyword 없이 qualifiers만 남겨 sponsors만 검증
    await input.fill('');

    // sponsors 필터 활성화 → 현재 구현은 `sponsors:true` 토큰이 추가되는 것으로 가정
    await sponsorsBtn.click();

    // UI 구현에 따라 `is:sponsorable` 또는 `sponsors:true` 등으로 들어올 수 있어 모두 허용
    await expect(input).toHaveValue(SPONSOR_TOKEN_RE);

    // qualifiers만 남기기
    await input.fill(finalizeQualifiersOnly(await input.inputValue()));
    await expect(input).toHaveValue(SPONSOR_TOKEN_RE_EXACT);

    const resPromise = waitUsersResponse(page, (q) => SPONSOR_TOKEN_RE.test(q));
    await searchBtn.click();

    const res = await resPromise;
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as SearchResponse;
    expect(Array.isArray(json.items)).toBeTruthy();
    expect(json.items.length).toBeGreaterThan(0);

    // mockUsers에 필드가 있는 경우만 true 검증 (없을 수도 있음)
    for (const u of json.items) {
      if (typeof u.sponsors === 'boolean') expect(u.sponsors).toBe(true);
      if (typeof u.sponsorable === 'boolean') expect(u.sponsorable).toBe(true);
    }
  });
});
