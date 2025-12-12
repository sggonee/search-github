import useRetry from '@/shared/hooks/useTry';
import http from '@/shared/http';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { GithubUser } from '../../user/interface';
import { GithubSearchUsers } from '../interface';

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

const throttle = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall < delay) return;
    lastCall = now;
    fn(...args);
  };
};

const encodeSearchParams = (q: string) => {
  return new URLSearchParams(q).entries().reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
};

export default function useGithubSearchUsers({ initData }: { initData: GithubSearchUsers | { items: GithubUser[] } }) {
  const didMountRef = useRef(false);
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('ssr');
  const [isLoading, setLoading] = useState(false);
  const [users, setUsers] = useState<GithubUser[]>(initData.items);

  const {
    count: retryCount,
    isLimitExceeded: isRetryLimitExceeded,
    isRetrying,
    schedule: scheduleRetry,
    reset: resetRetry,
  } = useRetry(MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS);

  const pagerRef = useRef({
    q: searchParams.toString(),
    page: 1,
    totalCount: 0,
    isFetching: false,
    isEnded: false,
  });

  const updatePager = (state: Partial<typeof pagerRef.current>) => {
    pagerRef.current = { ...pagerRef.current, ...state };
  };

  const isMounted = () => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return false;
    }
    return didMountRef.current;
  };

  const fetchGithubUsers = async (q: string, opt = { page: 1, reset: false }) => {
    if (!q || isRetryLimitExceeded) return;

    try {
      setLoading(true);
      updatePager({ isFetching: true });
      const data = await http.get('/api/github/search-users', {
        params: { ...encodeSearchParams(q), page: opt.page },
      });
      const { totalCount } = pagerRef.current;

      setMode('csr');
      setUsers((prev) => {
        if (opt.reset) return data.items;
        return [...prev, ...data.items];
      });
      updatePager({
        q,
        page: opt.page,
        totalCount: data?.total_count ?? totalCount,
        isEnded: data?.total_count > 0 && users.length >= data?.total_count,
      });
      resetRetry();
    } catch {
      scheduleRetry(() => fetchGithubUsers(q, opt));
    } finally {
      setLoading(false);
      updatePager({ isFetching: false });
    }
  };

  useEffect(() => {
    if (!isMounted()) return;
    resetRetry();
    fetchGithubUsers(searchParams.toString(), { page: 1, reset: true });
  }, [searchParams]);

  useEffect(() => {
    const infiniteScrolling = throttle(() => {
      const { q, page, isEnded, isFetching } = pagerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const isReached = scrollTop + clientHeight + 500 <= scrollHeight;

      if (isFetching || isEnded || isReached) return;

      fetchGithubUsers(q, { page: page + 1, reset: false });
    }, 200);

    window.addEventListener('scroll', infiniteScrolling, { passive: true });

    return () => {
      window.removeEventListener('scroll', infiniteScrolling);
    };
  }, []);

  return {
    users,
    retryCount,
    isServer: mode === 'ssr',
    isRetrying,
    isLoading,
  };
}
