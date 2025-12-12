'use client';

import CircularProgress from '@mui/material/CircularProgress';
import { PropsWithChildren } from 'react';
import { GithubUser } from '../../user/interface';
import useGithubSearchUsers from '../hooks/useGithubSearchUsers';
import { GithubSearchUsers } from '../interface';
import User from './User';

export default function UserView({
  children,
  initData,
}: PropsWithChildren<{
  initData: GithubSearchUsers | { items: GithubUser[] };
}>) {
  const { users, retryCount, isServer, isLoading, isRetrying } = useGithubSearchUsers({ initData });

  return (
    <ul className="w-full sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto space-y-2">
      {isServer ? <>{children}</> : users.map((item) => <User key={item.id} item={item} />)}
      {isLoading && (
        <div className="flex justify-center py-4">
          <CircularProgress size={22} thickness={4} />
        </div>
      )}
      {isRetrying && (
        <div className="text-center py-2 text-xs text-orange-500">
          요청 재시도 중... ({retryCount} / {5})
        </div>
      )}
    </ul>
  );
}
