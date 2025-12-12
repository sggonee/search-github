'use client';

export default function SearchUsersError({ error }: { error: Error & { digest?: string } }) {
  const onRefresh = () => {
    window.location.replace('/');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 bg-black/10">
      <div className="max-w-md w-full rounded-lg border border-slate-200 bg-white/70 p-6 shadow-sm text-center">
        <h1 className="text-lg font-semibold text-slate-900 mb-2">검색 중 문제가 발생했어요</h1>
        <p className="text-sm text-slate-600 mb-4">
          GitHub 사용자 검색을 처리하는 동안 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>
        {error?.message && (
          <details className="mb-4 rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <summary className="cursor-pointer select-none font-medium text-slate-600">오류 상세 보기</summary>
            <pre className="mt-1 whitespace-pre-wrap break-all">{error.message}</pre>
          </details>
        )}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onRefresh}
            className="
              inline-flex items-center justify-center
              rounded-md border border-slate-300
              bg-white px-3 py-1.5
              text-xs font-medium text-slate-700
              hover:bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-slate-400/50
            "
          >
            새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
