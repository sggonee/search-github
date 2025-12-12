import useSearch from '@/shared/hooks/useSearch';
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
  const { updateParams } = useSearch();
  const [mode, setMode] = useState('ssr');
  const [isFetching, setFetching] = useState(false);
  const [users, setUsers] = useState<GithubUser[]>(initData.items);

  const {
    count: retryCount,
    isLimitExceeded: isRetryLimitExceeded,
    isRetrying,
    schedule: scheduleRetry,
    reset: resetRetry,
  } = useRetry(MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS);

  const pagerRef = useRef({
    page: Number(initParams.page) || 1,
    totalCount: 0,
    isEnded: false,
  });

  const updatePager = (state: Partial<typeof pagerRef.current>) => {
    pagerRef.current = { ...pagerRef.current, ...state };
    state.page && updateParams({ page: `${state.page}` });
  };

  /**
   * TODO
   * 422 처리 -> 페이지 제거
   */
  const fetchGithubUsers = async (opt = { page: 1, reset: false }) => {
    if (!q || isRetryLimitExceeded) return;

    try {
      setFetching(true);
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
      setFetching(false);
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
    const infinityFetchScroll = throttle(() => {
      const { page, isEnded } = pagerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight + 500 <= scrollHeight || isEnded) return;
      fetchGithubUsers({ page: page + 1, reset: false });
    }, 500);

    window.addEventListener('scroll', infinityFetchScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', infinityFetchScroll);
    };
  }, []);

  return {
    users,
    retryCount,
    isServer: mode === 'ssr',
    isRetrying,
    isFetching,
  };
};

export default useGithubSearchUsers;
