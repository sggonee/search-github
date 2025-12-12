import { expect, test } from '../fixtures';

type SearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{ followers?: number; public_repos?: number; created_at?: string }>;
};

function assertSortedDesc(nums: number[]) {
  for (let i = 1; i < nums.length; i++) {
    expect(nums[i - 1]).toBeGreaterThanOrEqual(nums[i]);
  }
}

function assertSortedAsc(nums: number[]) {
  for (let i = 1; i < nums.length; i++) {
    expect(nums[i - 1]).toBeLessThanOrEqual(nums[i]);
  }
}

async function selectMUIOption(page: any, optionText: string) {
  const combo = page.getByRole('combobox').first();
  await combo.click();
  await page.getByRole('option', { name: new RegExp(optionText, 'i') }).click();
  await expect(combo).toHaveText(new RegExp(optionText, 'i'));
}

test.describe('Advanced filter — sort', () => {
  test('sort:followers desc updates q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    // keyword는 비우면 서버/목이 빈 결과를 줄 수 있으니, 목데이터에 존재하는 키워드로 고정
    await input.fill('user');

    // UI: 정렬 select에서 followers 선택
    await selectMUIOption(page, 'followers');

    const resP = page.waitForResponse((res: any) => {
      if (!res.url().includes('/api/github/search-users')) return false;
      if (res.request().method() !== 'GET') return false;

      const url = new URL(res.url());
      const q = url.searchParams.get('q') ?? '';
      if (!q.includes('user')) return false;
      const sort = url.searchParams.get('sort') ?? '';

      // 1) q 토큰 기반(legacy) 또는 2) 별도 query param 기반 둘 다 허용
      return q.includes('sort:followers') || sort === 'followers';
    });
    await searchBtn.click();

    const res = await resP;
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as SearchResponse;
    expect(json.items.length).toBeGreaterThan(0);

    const followers = json.items.map((u) => (typeof u.followers === 'number' ? u.followers : 0));
    assertSortedDesc(followers);
  });

  test('sort:repositories desc updates q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    await input.fill('user');

    await selectMUIOption(page, 'repositories');

    const resP = page.waitForResponse((res: any) => {
      if (!res.url().includes('/api/github/search-users')) return false;
      if (res.request().method() !== 'GET') return false;

      const url = new URL(res.url());
      const q = url.searchParams.get('q') ?? '';
      if (!q.includes('user')) return false;
      const sort = url.searchParams.get('sort') ?? '';

      return q.includes('sort:repositories') || q.includes('sort:repos') || sort === 'repositories' || sort === 'repos';
    });
    await searchBtn.click();

    const res = await resP;
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as SearchResponse;
    expect(json.items.length).toBeGreaterThan(0);

    const repos = json.items.map((u) => (typeof u.public_repos === 'number' ? u.public_repos : 0));
    assertSortedDesc(repos);
  });

  test('sort:joined updates q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    await input.fill('user');

    await selectMUIOption(page, 'joined');

    const resP = page.waitForResponse((res: any) => {
      if (!res.url().includes('/api/github/search-users')) return false;
      if (res.request().method() !== 'GET') return false;

      const url = new URL(res.url());
      const q = url.searchParams.get('q') ?? '';
      if (!q.includes('user')) return false;
      const sort = url.searchParams.get('sort') ?? '';

      return q.includes('sort:joined') || q.includes('sort:created') || sort === 'joined' || sort === 'created';
    });
    await searchBtn.click();

    const res = await resP;
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as SearchResponse;
    expect(json.items.length).toBeGreaterThan(0);

    const created = json.items.map((u) => {
      const v = typeof u.created_at === 'string' ? Date.parse(u.created_at) : 0;
      return Number.isFinite(v) ? v : 0;
    });

    // fixtures 기본 order는 desc. 만약 UI가 asc를 붙이면, 여기서 자동 판별.
    const q = (await res.request().url()).toString();
    const url = new URL(q);
    const qq = url.searchParams.get('q') ?? '';
    if (qq.includes('order:asc')) assertSortedAsc(created);
    else assertSortedDesc(created);
  });
});
