import useSearch from '@/shared/hooks/useSearch';
import useRetry from '@/shared/hooks/useTry';
import http from '@/shared/http';
import { useEffect, useRef, useState } from 'react';
import { GithubUser } from '../../user/interface';
import { GithubSearchUsers } from '../interface';

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

const useGithubSearchUsers = ({
  q,
  initParams,
  initData,
}: {
  q: string;
  initParams: { q: string; page: string };
  initData: GithubSearchUsers | { items: GithubUser[] };
}) => {
  const { updateParams } = useSearch();
  const [users, setUsers] = useState<GithubUser[]>(initData.items);

  const {
    count: retryCount,
    isLimitExceeded: isRetryLimitExceeded,
    isRetrying,
    schedule: scheduleRetry,
    reset: resetRetry,
  } = useRetry(MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS);

  const [pager, setPager] = useState({
    page: Number(initParams.page) || 1,
    loading: false,
    mode: 'ssr' as 'ssr' | 'csr',
    totalCount: 0,
  });

  const isEnded = users.length >= pager.totalCount && pager.totalCount > 0;
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const updatePager = (state: Partial<typeof pager>) => {
    setPager((prev) => ({ ...prev, ...state }));
    if (state.page) {
      updateParams({ page: `${state.page}` });
    }
  };

  const fetchGithubUsers = async (opt = { page: 1, reset: false }) => {
    if (!q || pager.loading || isRetryLimitExceeded) return;

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
      resetRetry();
    } catch (error: any) {
      const isReset = error?.status === 422;
      scheduleRetry(() => fetchGithubUsers(opt));
      updatePager({ loading: false, page: isReset ? 1 : pager.page });
      if (isReset) setUsers([]);
    }
  };

  // 검색어 변경 시 첫 페이지를 다시 가져옴
  useEffect(() => {
    if (initParams.q === q) return;
    resetRetry();
    fetchGithubUsers({ page: 1, reset: true });
  }, [q, initParams.q, resetRetry]);

  // 무한 스크롤 옵저버
  useEffect(() => {
    const target = loaderRef.current;
    if (!target || isEnded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || pager.loading || isRetrying) return;
        fetchGithubUsers({ page: pager.page + 1, reset: false });
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [q, isEnded, pager.page, pager.loading, isRetrying]);

  return {
    users,
    pager,
    loaderRef,
    retryCount,
    isRetrying,
  };
};

export default useGithubSearchUsers;
