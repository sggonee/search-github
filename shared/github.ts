import { GithubSearchUsers } from '@/features/github/searchUsers/interface';
import http from './http';

const baseUrl = 'https://api.github.com/search/users';

export const getGithubUsers = async (params: Record<string, string>): Promise<GithubSearchUsers> => {
  return await http.get(baseUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
    params: {
      ...params,
      per_page: '30',
      order: 'desc',
    },
  });
};
