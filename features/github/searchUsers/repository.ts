import http from '@/shared/http';
import { env } from '@/shared/policy/env';
import type { GitHubSearchUsersRepository, GithubSearchUsers } from './interface';

export function createGitHubSearchUserRepository(): GitHubSearchUsersRepository {
  return {
    async search(params: Record<string, string>): Promise<GithubSearchUsers> {
      return await http.get('https://api.github.com/search/users', {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `Bearer ${env.token}`,
        },
        params: {
          ...params,
          per_page: '30',
          order: 'desc',
        },
      });
    },
  };
}
