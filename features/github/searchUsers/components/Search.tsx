'use client';

import useSearch from '@/shared/hooks/useSearch';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useMemo } from 'react';

type AccountType = 'all' | 'user' | 'org';
type NameField = 'all' | 'login' | 'name' | 'email';

type SearchFormState = {
  keyword: string;
  accountType: AccountType;
  nameField: NameField;
};

const parseFormFromQuery = (q: string): SearchFormState => {
  const tokens = q.trim().split(/\s+/).filter(Boolean);

  let accountType: AccountType = 'all';
  let nameField: NameField = 'all';
  const keywordTokens: string[] = [];

  for (const token of tokens) {
    // type:user / type:org
    if (token.startsWith('type:')) {
      const [, type] = token.split(':');
      if (type === 'user' || type === 'org') {
        accountType = type;
        continue;
      }
    }

    // in:login / in:name / in:email
    if (token.startsWith('in:')) {
      const [, field] = token.split(':');
      if (field === 'login' || field === 'name' || field === 'email') {
        nameField = field;
        continue;
      }
    }

    keywordTokens.push(token);
  }

  return {
    keyword: keywordTokens.join(' '),
    accountType,
    nameField,
  };
};

const buildQueryFromForm = (formObj: Record<string, FormDataEntryValue>): string => {
  const terms: string[] = [];

  const q = (formObj.q as string) ?? '';
  const accountType = formObj.accountType ?? 'all';
  const nameField = formObj.nameField ?? 'all';

  // 1. 키워드 + in: 필드 처리 (q는 required이므로 항상 존재)
  if (nameField === 'all') {
    terms.push(q);
  } else {
    terms.push(`${q} in:${nameField}`);
  }

  // 2. 계정 타입 처리
  if (accountType !== 'all') {
    terms.push(`type:${accountType}`);
  }

  return terms.join(' ');
};

const Search = () => {
  const { updateParams } = useSearch();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const persistParams = useMemo(() => parseFormFromQuery(q), [q]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const form = Object.fromEntries(formData.entries());

    updateParams({ q: buildQueryFromForm(form) });
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

      <Paper key={q} component="form" onSubmit={onSubmit} elevation={3} className="w-full px-3 py-3 space-y-3">
        {/* 검색 키워드 */}
        <TextField
          fullWidth
          variant="standard"
          placeholder="사용자 이름 또는 키워드를 입력하세요"
          defaultValue={persistParams.keyword}
          name="q"
          required
          slotProps={{
            input: {
              inputProps: {
                pattern: '.*\\S.*',
                title: '공백만 입력할 수 없습니다.',
              },
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
        <FormControl component="fieldset">
          <Typography variant="subtitle2" className="mb-1">
            계정 유형
          </Typography>
          <RadioGroup row defaultValue={persistParams.accountType} name="accountType">
            <FormControlLabel value="all" control={<Radio />} label="전체 (사용자 + 조직)" />
            <FormControlLabel value="user" control={<Radio />} label="사용자만 (type:user)" />
            <FormControlLabel value="org" control={<Radio />} label="조직만 (type:org)" />
          </RadioGroup>
        </FormControl>

        {/* 계정 이름, 성명 또는 메일로 검색 (in:login / in:name / in:email) */}
        <FormControl component="fieldset">
          <Typography variant="subtitle2" className="mb-1">
            검색 대상
          </Typography>
          <RadioGroup row defaultValue={persistParams.nameField} name="nameField">
            <FormControlLabel value="all" control={<Radio />} label="전체 (기본)" />
            <FormControlLabel value="login" control={<Radio />} label="계정 이름 (in:login)" />
            <FormControlLabel value="name" control={<Radio />} label="성명 (in:name)" />
            <FormControlLabel value="email" control={<Radio />} label="이메일 (in:email)" />
          </RadioGroup>
        </FormControl>
      </Paper>
    </Box>
  );
};

export default Search;
