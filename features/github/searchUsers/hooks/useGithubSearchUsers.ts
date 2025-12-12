import useRetry from '@/shared/hooks/useTry';
import http from '@/shared/http';
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

const useGithubSearchUsers = ({
  q,
  initParams,
  initData,
}: {
  q: string;
  initParams: { q: string; page: string };
  initData: GithubSearchUsers | { items: GithubUser[] };
}) => {
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
    page: 1,
    totalCount: 0,
    isFetching: false,
    isEnded: false,
  });

  const updatePager = (state: Partial<typeof pagerRef.current>) => {
    pagerRef.current = { ...pagerRef.current, ...state };
  };

  const fetchGithubUsers = async (opt = { page: 1, reset: false }) => {
    if (!q || isRetryLimitExceeded) return;

    try {
      setLoading(true);
      updatePager({ isFetching: true });
      const data = await http.get('/api/github/search-users', { params: { q, page: opt.page } });
      const { totalCount } = pagerRef.current;

      setMode('csr');
      setUsers((prev) => {
        if (opt.reset) return data.items;
        return [...prev, ...data.items];
      });
      updatePager({
        page: opt.page,
        totalCount: data?.total_count ?? totalCount,
        isEnded: data?.total_count > 0 && users.length >= data?.total_count,
      });
      resetRetry();
    } catch {
      scheduleRetry(() => fetchGithubUsers(opt));
    } finally {
      setLoading(false);
      updatePager({ isFetching: false });
    }
  };

  // 검색어 변경 시 첫 페이지를 다시 가져옴
  // 단, 최초 렌더에서는 서버에서 받은 SSR 데이터를 그대로 사용하고 fetch 하지 않음
  useEffect(() => {
    if (initParams.q === q) return;
    resetRetry();
    fetchGithubUsers({ page: 1, reset: true });
  }, [q]);

  // 무한 스크롤: 스크롤 이벤트 + throttle + bottom 도달 감지
  useEffect(() => {
    const infiniteScrolling = throttle(() => {
      const { page, isEnded, isFetching } = pagerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const isReached = scrollTop + clientHeight + 500 <= scrollHeight;

      if (isFetching || isEnded || isReached) return;

      fetchGithubUsers({ page: page + 1, reset: false });
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
};

export default useGithubSearchUsers;
