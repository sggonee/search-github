import { expect, test } from '../fixtures';

type SearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{ public_repos?: number }>;
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

async function assertReposInRange(res: any, min: number, max: number) {
  expect(res.ok()).toBeTruthy();

  const json = (await res.json()) as SearchResponse;
  expect(Array.isArray(json.items)).toBeTruthy();
  expect(json.items.length).toBeGreaterThan(0);

  for (const u of json.items) {
    expect(typeof u.public_repos).toBe('number');
    expect(u.public_repos!).toBeGreaterThanOrEqual(min);
    expect(u.public_repos!).toBeLessThanOrEqual(max);
  }
}

test.describe('Advanced filter — repos', () => {
  test('repos: range updates q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    const reposBtn = page.getByTestId('filter-repos');

    // 기본 키워드
    await input.fill('alice');

    // repos 필터 활성화 → 현재 구현은 `repos:` prefix만 추가됨
    await reposBtn.click();
    await expect(input).toHaveValue(/repos:/);

    // (range UI가 아직 test-id로 제어되지 않으므로) 사용자가 range 값을 입력했다고 가정하고 토큰을 완성
    // `alice repos:` -> `alice repos:10..50`
    const current = await input.inputValue();
    await input.fill(current.replace(/repos:(?:\S*)?/, 'repos:10..50'));
    await expect(input).toHaveValue(/repos:10\.\.50/);

    const reposResPromise = waitUsersResponse(page, (q) => q.includes('repos:10..50'));

    await searchBtn.click();

    await assertReposInRange(await reposResPromise, 10, 50);
  });
});
