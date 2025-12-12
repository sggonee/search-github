import { expect, test } from '../fixtures';

type SearchResponse = {
  items: Array<{ type: string; login: string; name?: string | null; email?: string | null }>;
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

test.describe('Advanced filter — in', () => {
  test('in: toggles update q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    // ✅ 네 UI에서 사용 중인 testid로 맞춰줘 (예: filter-in-login)
    const inLoginBtn = page.getByTestId('filter-in-login');

    // keyword
    await input.fill('alice');

    // in:login ON
    await inLoginBtn.click();
    await expect(input).toHaveValue(/in:login/);

    const resPromise = waitUsersResponse(page, (q) => q.includes('in:login') && q.includes('alice'));
    await searchBtn.click();

    const res = await resPromise;
    expect(res.ok()).toBeTruthy();

    const json = (await res.json()) as SearchResponse;
    expect(Array.isArray(json.items)).toBeTruthy();
    expect(json.items.length).toBeGreaterThan(0);

    // mock이 in:login 기준으로 필터링한다는 계약 검증
    for (const u of json.items) {
      expect((u.login ?? '').toLowerCase()).toContain('alice');
    }
  });
});
