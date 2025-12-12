'use client';

import useSearch from '@/shared/hooks/useSearch';
import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useSearchParams } from 'next/navigation';

const SortControl = () => {
  const { updateParams } = useSearch();
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') ?? '';

  const onSort = (event: SelectChangeEvent) => {
    const nextSort = event.target.value ?? '';
    updateParams({ sort: nextSort });
  };

  return (
    <FormControl size="small" className="min-w-[150px]">
      <Select value={sort} onChange={onSort} displayEmpty>
        <MenuItem value="">default</MenuItem>
        <MenuItem value="followers">Followers</MenuItem>
        <MenuItem value="repositories">Repositories</MenuItem>
        <MenuItem value="joined">Joined</MenuItem>
      </Select>
    </FormControl>
  );
};

export default SortControl;
