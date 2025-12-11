'use client';

import { useSearchParams } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { GithubUser } from '../../user/interface';
import useGithubSearchUsers from '../hooks/useGithubSearchUsers';
import { GithubSearchUsers } from '../interface';
import User from './User';

const UserView = ({
  children,
  initParams,
  initData,
}: PropsWithChildren<{
  initParams: { q: string; page: string };
  initData: GithubSearchUsers | { items: GithubUser[] };
}>) => {
  const searchParams = useSearchParams();
  const { users, pager, loaderRef, retryCount, isRetrying } = useGithubSearchUsers({
    q: searchParams.get('q') ?? '',
    initParams,
    initData,
  });

  return (
    <>
      {pager.mode === 'csr' ? users.map((item) => <User key={item.id} item={item} />) : children}
      <div ref={loaderRef} className="h-4" />
      {pager.loading && <div className="text-center py-4 text-sm text-gray-400">Loading...</div>}
      {isRetrying && (
        <div className="text-center py-2 text-xs text-orange-500">
          레이트리밋 초과로 재시도 중... ({retryCount} / {5})
        </div>
      )}
    </>
  );
};

export default UserView;
