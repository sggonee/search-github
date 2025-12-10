'use client';

import useSearch from '@/shared/hooks/useSearch';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

type AccountType = 'all' | 'user' | 'org';
type NameField = 'all' | 'login' | 'name' | 'email';

type SearchFormState = {
  keyword: string;
  accountType: AccountType;
  nameField: NameField;
  repos: { min: number; max: number };
};

const parseFormFromQuery = (q: string): SearchFormState => {
  const tokens = q.trim().split(/\s+/).filter(Boolean);
  const result: string[] = [];

  let accountType: AccountType = 'all';
  let nameField: NameField = 'all';
  let repos = { min: 0, max: 1000 };

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

    if (token.startsWith('repos:')) {
      const [, range] = token.split(':');
      const [min, max] = range?.split('..').map(Number) ?? [0, 1000];
      repos = { min, max };
      continue;
    }

    result.push(token);
  }

  return {
    keyword: result.join(' '),
    accountType,
    nameField,
    repos,
  };
};

const buildQueryFromForm = (formObj: Record<string, FormDataEntryValue>): string => {
  const terms: string[] = [];

  const q = (formObj.q as string) ?? '';
  const accountType = formObj.accountType ?? 'all';
  const nameField = formObj.nameField ?? 'all';

  const reposEnabled = formObj.reposEnabled;
  const repos = formObj.repos;

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

  // 활성화 상태이고, repos 값이 기본 범위가 아닐 때만 조건으로 추가
  if (reposEnabled) {
    terms.push(`repos:${repos}`);
  }

  return terms.join(' ');
};

const Search = () => {
  const { updateParams } = useSearch();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const persistParams = useMemo(() => parseFormFromQuery(q), [q]);

  const [reposRange, setReposRange] = useState<[number, number]>([persistParams.repos.min, persistParams.repos.max]);
  const [reposEnabled, setReposEnabled] = useState(!!persistParams.repos);

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

        <FormControl component="fieldset" className="w-full">
          <Box className="flex items-center justify-between mb-1">
            <Typography variant="subtitle2">리포지토리 수</Typography>
          </Box>
          <Box className="gap-2">
            <FormControlLabel
              control={
                <Checkbox
                  name="reposEnabled"
                  checked={reposEnabled}
                  onChange={(_, checked) => {
                    setReposEnabled(checked);
                    const form = document.querySelector('form');
                    const reposInput = form!.querySelector('input[name="repos"]') as HTMLInputElement | null;
                    if (reposInput) {
                      reposInput.value = checked ? `${reposRange[0]}..${reposRange[1]}` : '0..1000';
                    }
                  }}
                  size="small"
                />
              }
              label="활성화"
              className="whitespace-nowrap"
            />
            <Box>
              <Slider
                value={reposRange}
                min={0}
                max={1000}
                valueLabelDisplay="auto"
                onChange={(_, value) => {
                  const [min, max] = value as number[];
                  setReposRange([min, max]);
                  const form = document.querySelector('form');
                  if (form) {
                    const reposInput = form.querySelector('input[name="repos"]') as HTMLInputElement | null;
                    if (reposInput) {
                      reposInput.value = `${min}..${max}`;
                    }
                  }
                }}
                disabled={!reposEnabled}
              />
            </Box>

            <input type="hidden" name="repos" defaultValue={`${reposRange[0]}..${reposRange[1]}`} />
          </Box>
        </FormControl>
      </Paper>
    </Box>
  );
};

export default Search;
