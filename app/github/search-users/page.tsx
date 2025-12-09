import Search from '@/features/github/searchUsers/components/Search';
import { createGitHubSearchUserRepository } from '@/features/github/searchUsers/repository';
import { createSearchUsersService } from '@/features/github/searchUsers/service';

export default async function Page({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const params = await searchParams;
  const repo = createGitHubSearchUserRepository();
  const searchUsers = createSearchUsersService(repo);
  const data = params.q ? await searchUsers(params) : { items: [] };

  return (
    <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
      <Search />
      <ul>
        {data.items.map((item: any) => {
          return (
            <li key={item.id}>
              ({item.id}) {item.login}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
