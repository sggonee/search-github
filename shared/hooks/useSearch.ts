import { useSearchParams } from 'next/navigation';

// 참고: https://nextjs.org/docs/app/getting-started/linking-and-navigating

const useSearch = () => {
  const searchParams = useSearchParams();

  const updateParams = (params: Record<string, string>) => {
    const result = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      value ? result.set(key, value) : result.delete(key);
    });
    window.history.pushState(null, '', `?${result.toString()}`);
  };

  return { updateParams };
};

export default useSearch;
