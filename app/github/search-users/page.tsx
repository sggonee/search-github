import { createGitHubSearchUserRepository } from '@/features/github/searchUsers/repository';
import { createSearchUsersService } from '@/features/github/searchUsers/service';

export default async function Page({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const params = await searchParams;
  const repo = createGitHubSearchUserRepository();
  const searchUsers = createSearchUsersService(repo);
  const data = params.q ? await searchUsers(params) : { items: [] };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
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
    </div>
  );
}
