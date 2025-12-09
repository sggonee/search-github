import { getGithubUsers } from '@/shared/github';
import type { GitHubSearchUsersRepository, GithubSearchUsers } from './interface';

export function createGitHubSearchUserRepository(): GitHubSearchUsersRepository {
  return {
    async search(params: Record<string, string>): Promise<GithubSearchUsers> {
      return await getGithubUsers(params);
    },
  };
}
