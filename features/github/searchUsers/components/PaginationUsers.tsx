'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GithubSearchUsers } from '../interface';
import User from './User';

const PaginationUsers = () => {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<GithubSearchUsers | null>(null);
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const page = searchParams.get('page') || '';
    const r = async () => {
      if (!q) return;
      const result = await fetch(`/api/github/search-users?q=${q}&page=${page}`);
      const data = await result.json();
      setUsers(data);
    };
    r();
  }, [searchParams]);
  if (!users) return;
  return (
    <>
      {users.items.map((item) => (
        <User key={item.id} item={item} />
      ))}
    </>
  );
};

export default PaginationUsers;
