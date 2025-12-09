'use client';

import useSearch from '@/shared/hooks/useSearch';
import { FormEvent, useRef } from 'react';

export default function Search() {
  const { updateParams } = useSearch();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({
      q: inputRef.current?.value ?? '',
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <input type="text" id="search-users" ref={inputRef} />
    </form>
  );
}
