'use client';

import useSearch from '@/shared/hooks/useSearch';
import http from '@/shared/http';
import { useSearchParams } from 'next/navigation';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { GithubUser } from '../../user/interface';
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
  const { updateParams } = useSearch();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [users, setUsers] = useState<GithubUser[]>(initData.items);
  const [retryCount, setRetryCount] = useState(0);
  const [pager, setPager] = useState({
    page: Number(initParams.page) || 1,
    loading: false,
    mode: 'ssr',
    totalCount: 0,
  });
  const isEnded = users.length >= pager.totalCount && pager.totalCount > 0;
  const isRetrying = retryCount > 0 && retryCount < 5;
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const updatePager = (state: Partial<typeof pager>) => {
    setPager((prev) => ({ ...prev, ...state }));
    state.page && updateParams({ page: `${state.page}` });
  };

  const retryGithubSearchUsers = async (fn: () => Promise<void>) => {
    if (retryCount >= 5) return; // stop after 5 retries
    setRetryCount((c) => c + 1);
    setTimeout(fn, 1000); // wait 1s then retry
  };

  // 공통 페이지 로더: page 번호와 reset 여부를 받아,
  // - reset 시에는 기존 목록을 갈아끼우고
  // - 아니면 append 방식으로 이어 붙입니다.
  const fetchGithubUsers = async (opt = { page: 1, reset: false }) => {
    if (!q || pager.loading) return;

    try {
      updatePager({ loading: true });

      const data = await http.get('/api/github/search-users', { params: { q, page: opt.page } });

      setUsers((prev) => {
        if (opt.reset) return data.items;
        return [...prev, ...data.items];
      });

      updatePager({
        mode: 'csr',
        page: opt.page,
        loading: false,
        totalCount: data.total_count ?? pager.totalCount,
      });
      setRetryCount(0);
    } catch {
      retryGithubSearchUsers(() => fetchGithubUsers(opt));
      updatePager({ loading: false });
    }
  };

  useEffect(() => {
    if (initParams.q === q) return;
    fetchGithubUsers({ page: 1, reset: true });
  }, [q]);

  useEffect(() => {
    const target = loaderRef.current;
    if (!target || isEnded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        fetchGithubUsers({ page: pager.page + 1, reset: false });
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [q, isEnded, pager.page]);

  return (
    <>
      {pager.mode === 'csr' ? users.map((item, i) => <User key={item.id} item={item} />) : <>{children}</>}
      <div ref={loaderRef} className="h-4" />
      {pager.loading && <div className="text-center py-4 text-sm text-gray-400">Loading...</div>}
      {isRetrying && (
        <div className="text-center py-2 text-xs text-orange-500">
          레이트리밋 초과로 재시도 중... ({retryCount} / 5)
        </div>
      )}
    </>
  );
};

export default UserView;
