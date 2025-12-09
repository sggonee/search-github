import { GithubUser } from '../user/interface';

interface GithubUsersMeta {
  total_count: number;
  incomplete_results: boolean;
}

export interface GithubSearchUsers extends GithubUsersMeta {
  items: GithubUser[];
}

export interface GitHubSearchUsersRepository {
  search(query: string): Promise<GithubSearchUsers>;
}
