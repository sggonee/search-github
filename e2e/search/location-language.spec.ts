import { expect, test } from '../fixtures';

type SearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{ location?: string; language?: string; lang?: string }>;
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

test.describe('Advanced filter — location/language', () => {
  test('location:/language: update q and API response', async ({ gotoHome, page }) => {
    await gotoHome();

    const input = page.locator('input[name="q"]');
    const searchBtn = page.getByRole('button', { name: '검색' });

    const locationBtn = page.getByTestId('filter-location');
    const languageBtn = page.getByTestId('filter-language');

    // keyword 없이 qualifiers만 남겨 필터만 검증
    await input.fill('');

    // 1) location
    await locationBtn.click();
    await expect(input).toHaveValue(/location:/);

    const locCurrent = await input.inputValue();
    await input.fill(locCurrent.replace(/location:(?:\S*)?/, 'location:seoul'));
    await input.fill(finalizeQualifiersOnly(await input.inputValue()));
    await expect(input).toHaveValue(/^location:seoul$/);

    const locResP = waitUsersResponse(page, (q) => q.includes('location:seoul'));
    await searchBtn.click();

    const locRes = await locResP;
    expect(locRes.ok()).toBeTruthy();
    const locJson = (await locRes.json()) as SearchResponse;
    expect(Array.isArray(locJson.items)).toBeTruthy();
    expect(locJson.items.length).toBeGreaterThan(0);

    // location이 있는 아이템들만 검사 (mockUsers에 location이 없을 수도 있음)
    for (const u of locJson.items) {
      if (typeof u.location === 'string') {
        expect(u.location.toLowerCase()).toContain('seoul');
      }
    }

    // 2) language (location + language 동시 적용)
    await languageBtn.click();
    await expect(input).toHaveValue(/language:/);

    const langCurrent = await input.inputValue();
    await input.fill(langCurrent.replace(/language:(?:\S*)?/, 'language:typescript'));
    await input.fill(finalizeQualifiersOnly(await input.inputValue()));

    await expect(input).toHaveValue(/location:seoul/);
    await expect(input).toHaveValue(/language:typescript/);

    const langResP = waitUsersResponse(page, (q) => q.includes('location:seoul') && q.includes('language:typescript'));
    await searchBtn.click();

    const langRes = await langResP;
    expect(langRes.ok()).toBeTruthy();
    const langJson = (await langRes.json()) as SearchResponse;
    expect(Array.isArray(langJson.items)).toBeTruthy();
    expect(langJson.items.length).toBeGreaterThan(0);

    for (const u of langJson.items) {
      const field = (u.language ?? u.lang) as unknown;
      if (typeof field === 'string') {
        expect(field.toLowerCase()).toContain('typescript');
      }
      if (typeof u.location === 'string') {
        expect(u.location.toLowerCase()).toContain('seoul');
      }
    }
  });
});
