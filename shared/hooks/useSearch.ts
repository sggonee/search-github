import { useSearchParams } from 'next/navigation';

// 참고: https://nextjs.org/docs/app/getting-started/linking-and-navigating

export default function useSearch() {
  const searchParams = useSearchParams();

  const updateParams = (params: Record<string, string>) => {
    const result = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      value ? result.set(key, value) : result.delete(key);
    });
    window.history.pushState(null, '', `?${decodeURIComponent(result.toString())}`);
  };

  return { updateParams };
}
