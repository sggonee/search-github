import { expect, test } from '../fixtures';

type SearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{ created_at?: string }>;
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

async function assertCreatedInRange(res: any, startISO: string, endISO: string) {
  expect(res.ok()).toBeTruthy();

  const json = (await res.json()) as SearchResponse;
  expect(Array.isArray(json.items)).toBeTruthy();
  expect(json.items.length).toBeGreaterThan(0);

  const start = Date.parse(`${startISO}T00:00:00.000Z`);
  const end = Date.parse(`${endISO}T23:59:59.999Z`);

  for (const u of json.items) {
    expect(typeof u.created_at).toBe('string');
    const createdAt = Date.parse(u.created_at!);
    expect(Number.isFinite(createdAt)).toBeTruthy();
    expect(createdAt).toBeGreaterThanOrEqual(start);
    expect(createdAt).toBeLessThanOrEqual(end);
  }
}

test.describe('Advanced filter — created', () => {
  test('created: range updates q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    const createdBtn = page.getByTestId('filter-created');

    // keyword 없이 qualifiers만 남겨 created-range만 검증
    await input.fill('');

    // created 필터 활성화 → 현재 구현은 `created:` prefix만 추가됨
    await createdBtn.click();
    await expect(input).toHaveValue(/created:/);

    // range UI가 아직 test-id로 제어되지 않으므로 토큰을 완성
    const current = await input.inputValue();
    await input.fill(current.replace(/created:(?:\S*)?/, 'created:2010-01-01..2030-12-31'));

    // qualifiers만 남기기
    const finalized = (await input.inputValue())
      .split(/\s+/)
      .filter((t) => t.includes(':'))
      .join(' ');
    await input.fill(finalized);

    await expect(input).toHaveValue(/^created:2010-01-01\.\.2030-12-31$/);

    const resPromise = waitUsersResponse(page, (q) => q.includes('created:2010-01-01..2030-12-31'));
    await searchBtn.click();

    await assertCreatedInRange(await resPromise, '2010-01-01', '2030-12-31');
  });
});
