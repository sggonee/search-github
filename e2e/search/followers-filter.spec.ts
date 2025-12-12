import { expect, test } from '../fixtures';

type SearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{ followers?: number }>;
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

async function assertFollowersInRange(res: any, min: number, max: number) {
  expect(res.ok()).toBeTruthy();

  const json = (await res.json()) as SearchResponse;
  expect(Array.isArray(json.items)).toBeTruthy();
  expect(json.items.length).toBeGreaterThan(0);

  for (const u of json.items) {
    expect(typeof u.followers).toBe('number');
    expect(u.followers!).toBeGreaterThanOrEqual(min);
    expect(u.followers!).toBeLessThanOrEqual(max);
  }
}

test.describe('Advanced filter — followers', () => {
  test('followers: range updates q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    const followersBtn = page.getByTestId('filter-followers');

    // ⚠️ keyword(첫 non-qualifier 토큰)가 들어가면 fixtures의 기본 in:login 필터가 같이 적용됨.
    // followers range만 테스트하려고 keyword 없이 시작한다.
    await input.fill('');

    // followers 필터 활성화 → 현재 구현은 `followers:` prefix만 추가됨
    await followersBtn.click();
    await expect(input).toHaveValue(/followers:/);

    // range UI가 아직 test-id로 제어되지 않으므로 토큰을 완성
    const current = await input.inputValue();
    await input.fill(current.replace(/followers:(?:\S*)?/, 'followers:10..50'));

    // keyword가 섞이지 않도록 qualifiers만 남긴다.
    // e.g. "kevin followers:10..50" -> "followers:10..50"
    const finalized = (await input.inputValue())
      .split(/\s+/)
      .filter((t) => t.includes(':'))
      .join(' ');
    await input.fill(finalized);

    await expect(input).toHaveValue(/^followers:10\.\.50$/);

    const resPromise = waitUsersResponse(page, (q) => q.includes('followers:10..50'));
    await searchBtn.click();

    await assertFollowersInRange(await resPromise, 10, 50);
  });
});
