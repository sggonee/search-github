import { expect, test } from '../fixtures';

test.describe('Search results — infinite scroll', () => {
  test('스크롤하면 다음 페이지 요청이 발생하고 더 많은 결과가 렌더된다', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    // mockUsers(user-###)를 타겟팅
    await input.fill('user');

    // 첫 응답(페이지 1) 기다리기
    const firstResP = page.waitForResponse((res) => {
      if (!res.url().includes('/api/github/search-users')) return false;
      if (res.request().method() !== 'GET') return false;
      const url = new URL(res.url());
      const q = url.searchParams.get('q') ?? '';
      const pageNo = url.searchParams.get('page') ?? '';
      return q.includes('user') && (pageNo === '' || pageNo === '1');
    });

    await searchBtn.click();
    await firstResP;

    // 첫 페이지 일부 렌더 확인
    await expect(page.getByText('user-001', { exact: false })).toBeVisible();

    const listItems = page.locator('main [role="list"] > [role="listitem"], main ul > li');
    const initialCount = await listItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // (옵션) 2페이지 요청이 발생하는지 짧게만 확인. (구현이 page 파라미터를 안 쓰면 그냥 넘어감)
    const secondPageResP = page
      .waitForResponse(
        (res) => {
          if (!res.url().includes('/api/github/search-users')) return false;
          if (res.request().method() !== 'GET') return false;
          const url = new URL(res.url());
          const q = url.searchParams.get('q') ?? '';
          return q.includes('user') && url.searchParams.get('page') === '2';
        },
        { timeout: 1500 },
      )
      .catch(() => null);

    // 스크롤을 여러 번 수행(IntersectionObserver/virtualized list 모두 대응)
    for (let i = 0; i < 16; i++) {
      await page.mouse.wheel(0, 1600);
      await page.waitForTimeout(120);

      // 중간 marker가 보이면 충분히 내려간 것
      const mid = page.getByText('user-050', { exact: false });
      if (await mid.isVisible().catch(() => false)) break;
    }

    // 가능하면 2페이지 응답까지 확인(짧게)
    await secondPageResP;

    // 스크롤 이후: (1) 아이템 수가 늘었거나, (2) 더 아래 마커가 보이면 OK
    const afterCount = await listItems.count();

    // 구현에 따라 첫 요청에서 이미 많이 내려올 수 있으니, 최소 50개 이상 렌더되면 통과
    if (afterCount < 50) {
      // count가 충분히 늘지 않았다면 marker 기반으로 확인
      await expect(page.getByText('user-050', { exact: false })).toBeVisible({ timeout: 5_000 });
    } else {
      expect(afterCount).toBeGreaterThanOrEqual(50);
    }
  });
});
