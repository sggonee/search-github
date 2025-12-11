'use client';

import http from '@/shared/http';
import { useSearchParams } from 'next/navigation';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { GithubUser } from '../../user/interface';
import { GithubSearchUsers } from '../interface';
import User from './User';

function throttle<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall < delay) return;

    lastCall = now;
    fn(...args);
  };
}

const UserView = ({
  children,
  initParams,
  initData,
}: PropsWithChildren<{
  initParams: { q: string; page: string };
  initData: GithubSearchUsers | { items: GithubUser[] };
}>) => {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [users, setUsers] = useState<GithubUser[]>(initData.items);
  const [pager, setPager] = useState({
    page: Number(initParams.page) || 1,
    loading: false,
    mode: 'ssr',
    totalCount: 0,
  });
  const isEnded = users.length >= pager.totalCount && pager.totalCount > 0;
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const updatePager = (value: Partial<typeof pager>) => {
    setPager((prev) => ({ ...prev, ...value }));
  };

  useEffect(() => {
    if (initParams.q === q) return;
    const fetchUsers = throttle(async () => {
      try {
        const data = await http.get('/api/github/search-users', { params: searchParams });
        setUsers(data.items);
        updatePager({ mode: 'csr', page: 1, loading: true, totalCount: data.total_count });
      } catch (error) {
        console.error(error);
        updatePager({ loading: false });
      } finally {
        updatePager({ loading: false });
      }
    }, 500);
    fetchUsers();
  }, [q]);

  useEffect(() => {
    const target = loaderRef.current;
    if (!target || isEnded) return;

    const fetchUsers = throttle(async () => {
      if (pager.loading) return;
      const nextPage = pager.page + 1;

      try {
        updatePager({ loading: true });
        const data = await http.get(`/api/github/search-users`, {
          params: { q, page: nextPage },
        });

        setUsers((prev) => [...prev, ...(data?.items ?? [])]);
        updatePager({
          mode: 'csr',
          page: nextPage,
          loading: false,
          totalCount: data.total_count,
        });
      } catch (error) {
        console.error(error);
        updatePager({ loading: false });
      } finally {
        updatePager({ loading: false });
      }
    }, 500);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          fetchUsers();
        }
      },
      {
        threshold: 0.1,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [q, isEnded, pager.page, pager.loading]);

  return (
    <>
      {pager.mode === 'csr' ? users.map((item, i) => <User i={i} key={item.id} item={item} />) : <>{children}</>}
      <div ref={loaderRef} className="h-4" />
      {pager.loading && <div className="text-center py-4 text-sm text-gray-400">Loading...</div>}
    </>
  );
};

export default UserView;
