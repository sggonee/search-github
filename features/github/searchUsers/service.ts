import type { GitHubSearchUsersRepository, GithubSearchUsers } from './interface';

export function createSearchUsersService(repo: GitHubSearchUsersRepository) {
  return async (query: string): Promise<GithubSearchUsers> => {
    // 여기서 비즈니스 정책, 검증, 로깅, 캐시, 권한 체크 다 할 수 있음
    return await repo.search(query);
  };
}
