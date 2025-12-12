import type { GitHubSearchUsersRepository, GithubSearchUsers } from './interface';

const fallback = { items: [], total_count: 0, incomplete_results: false };

export function createSearchUsersService(repo: GitHubSearchUsersRepository) {
  // 여기서 비즈니스 정책, 검증, 로깅, 캐시, 권한 체크 다 할 수 있음
  return async (params: Record<string, string>): Promise<GithubSearchUsers> => {
    const q = params.q;
    if (!q) return fallback;
    try {
      return await repo.search(params);
    } catch {
      return fallback;
    }
  };
}
