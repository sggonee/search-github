import { createGitHubSearchUserRepository } from "./repository";
import { createSearchUsersService } from "./usecase";

// 앱에서 바로 호출할 수 있는 진입점
export async function searchGitHubUsers(query: string) {
  const repo = createGitHubSearchUserRepository();
  const search = createSearchUsersService(repo);
  return search(query);
}
