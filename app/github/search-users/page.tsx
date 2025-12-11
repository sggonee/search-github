import Search from '@/features/github/searchUsers/components/Search';
import User from '@/features/github/searchUsers/components/User';
import UserView from '@/features/github/searchUsers/components/UserView';
import { createGitHubSearchUserRepository } from '@/features/github/searchUsers/repository';
import { createSearchUsersService } from '@/features/github/searchUsers/service';
import { Suspense } from 'react';

export default async function Page({ searchParams }: { searchParams: Promise<{ q: string; page: string }> }) {
  const params = await searchParams;
  const repo = createGitHubSearchUserRepository();
  const searchUsers = createSearchUsersService(repo);
  const data = params.q
    ? await searchUsers({ ...params, page: params.page || '1' })
    : { items: [], total_count: 0, incomplete_results: false };

  return (
    <>
      <Suspense>
        <Search />
      </Suspense>
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
        <Suspense>
          <UserView initParams={params} initData={data}>
            {data.items.map((item) => (
              <User key={item.id} item={item} />
            ))}
          </UserView>
        </Suspense>
      </ul>
    </>
  );
}
