import { expect, test } from '../fixtures';

type SearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{ type: 'User' | 'Organization' | string }>;
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

async function assertAllItemsType(res: any, expectedType: 'User' | 'Organization') {
  expect(res.ok()).toBeTruthy();

  const json = (await res.json()) as SearchResponse;
  expect(Array.isArray(json.items)).toBeTruthy();
  expect(json.items.length).toBeGreaterThan(0);

  for (const u of json.items) expect(u.type).toBe(expectedType);
}

test.describe('Advanced: type filter', () => {
  test('필터 토글에 따라 q 토큰과 API 응답(items[].type)이 일치한다', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    const orgBtn = page.getByTestId('filter-organization');
    const userBtn = page.getByTestId('filter-user');

    // 기본 검색어
    await input.fill('alice');

    // 1) type:org
    await orgBtn.click();
    await expect(input).toHaveValue(/type:org/);

    const orgResPromise = waitUsersResponse(page, (q) => q.includes('type:org'));
    await searchBtn.click();
    await assertAllItemsType(await orgResPromise, 'Organization');

    // 2) type:user
    await userBtn.click();
    await expect(input).toHaveValue(/type:user/);
    await expect(input).not.toHaveValue(/type:org/);

    const userResPromise = waitUsersResponse(page, (q) => q.includes('type:user'));
    await searchBtn.click();
    await assertAllItemsType(await userResPromise, 'User');

    // 3) user 토글 off (type 토큰 없음)
    await userBtn.click();
    await expect(input).not.toHaveValue(/type:user/);

    const allResPromise = waitUsersResponse(page, (q) => !q.includes('type:user') && !q.includes('type:org'));
    await searchBtn.click();

    const allRes = await allResPromise;
    expect(allRes.ok()).toBeTruthy();
    const allJson = (await allRes.json()) as SearchResponse;
    expect(Array.isArray(allJson.items)).toBeTruthy();
    expect(allJson.items.length).toBeGreaterThan(0);

    // 필터가 없으면 mixed 가능 (목데이터 기준)
    const types = new Set(allJson.items.map((u) => u.type));
    expect(types.size).toBeGreaterThan(0);
  });
});
