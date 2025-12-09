import { getGithubUsers } from '@/shared/github';
import type { GitHubSearchUsersRepository, GithubSearchUsers } from './interface';

export function createGitHubSearchUserRepository(): GitHubSearchUsersRepository {
  return {
    async search(query: string): Promise<GithubSearchUsers> {
      return await getGithubUsers(query);
    },
  };
}
