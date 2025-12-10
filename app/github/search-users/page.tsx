import Search from '@/features/github/searchUsers/components/Search';
import { createGitHubSearchUserRepository } from '@/features/github/searchUsers/repository';
import { createSearchUsersService } from '@/features/github/searchUsers/service';

export default async function Page({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const params = await searchParams;
  const repo = createGitHubSearchUserRepository();
  const searchUsers = createSearchUsersService(repo);
  const data = params.q ? await searchUsers(params) : { items: [] };

  return (
    <>
      <Search />
      <ul
        className="
          w-full
          sm:max-w-md
          md:max-w-lg
          lg:max-w-2xl
          xl:max-w-3xl
          mx-auto
          space-y-2
        "
      >
        {data.items.map((item) => (
          <li key={item.id} className="border rounded px-3 py-2 flex gap-2 items-center">
            {item.login}
          </li>
        ))}
      </ul>
    </>
  );
}
