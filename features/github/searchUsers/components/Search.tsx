'use client';

import useSearch from '@/shared/hooks/useSearch';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useRef } from 'react';

type AccountType = 'all' | 'user' | 'org';

type SearchFormState = {
  keyword: string;
  accountType: AccountType;
};

const parseFormFromQuery = (q: string): SearchFormState => {
  const tokens = q.trim().split(/\s+/).filter(Boolean);

  let accountType: AccountType = 'all';
  const keywordTokens: string[] = [];

  for (const token of tokens) {
    if (token.startsWith('type:')) {
      const [, type] = token.split(':');
      if (type === 'user' || type === 'org') {
        accountType = type;
        continue;
      }
    }
    keywordTokens.push(token);
  }

  return {
    keyword: keywordTokens.join(' '),
    accountType,
  };
};

const buildQueryFromForm = ({ keyword, accountType }: SearchFormState): string => {
  const terms = [keyword.trim(), accountType !== 'all' ? `type:${accountType}` : ''].filter(Boolean);

  return terms.join(' ');
};

const Search = () => {
  const { updateParams } = useSearch();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const persistParams = useMemo(() => parseFormFromQuery(q), [q]);

  const keywordRef = useRef<HTMLInputElement>(null);
  const accountTypeRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const keyword = keywordRef.current?.value.trim() || '';
    const accountType = (accountTypeRef.current?.value as AccountType) || 'all';

    const q = buildQueryFromForm({ keyword, accountType });
    updateParams({ q });
  };

  return (
    <Box
      component="section"
      className="
        w-full
        sm:max-w-md
        md:max-w-lg
        lg:max-w-2xl
        xl:max-w-3xl
        mx-auto
        mb-8
      "
    >
      <Typography variant="h5" component="h1" className="mb-4 font-semibold">
        GitHub 사용자 검색
      </Typography>

      <Paper key={q} component="form" onSubmit={handleSubmit} elevation={3} className="w-full px-3 py-3 space-y-3">
        {/* 검색 키워드 */}
        <TextField
          fullWidth
          variant="standard"
          placeholder="사용자 이름 또는 키워드를 입력하세요"
          defaultValue={persistParams.keyword}
          inputRef={keywordRef}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" size="small" aria-label="검색">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
              disableUnderline: true,
            },
          }}
        />

        {/* 사용자 또는 조직만 검색 (type:user / type:org) */}
        <FormControl fullWidth variant="standard">
          <InputLabel id="account-type-label">계정 유형</InputLabel>
          <Select
            labelId="account-type-label"
            defaultValue={persistParams.accountType}
            inputRef={accountTypeRef}
            label="계정 유형"
          >
            <MenuItem value="all">전체 (사용자 + 조직)</MenuItem>
            <MenuItem value="user">사용자만 (type:user)</MenuItem>
            <MenuItem value="org">조직만 (type:org)</MenuItem>
          </Select>
        </FormControl>
      </Paper>
    </Box>
  );
};

export default Search;
