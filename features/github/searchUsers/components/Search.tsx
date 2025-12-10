'use client';

import useSearch from '@/shared/hooks/useSearch';
import { getCountries } from '@/shared/policy/country';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
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

// Country option type
interface CountryOption {
  code: string;
  name: string;
}

type AccountType = 'all' | 'user' | 'org';
type NameField = 'all' | 'login' | 'name' | 'email';

type SearchFormState = {
  keyword: string;
  accountType: AccountType;
  nameField: NameField;
  repos: { min: number; max: number };
  location: string;
  language: string;
  followers: { min: number; max: number };
  created: string;
  sponsorable: boolean;
};

const countries = getCountries();

const languages = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Kotlin',
  'Swift',
];

const createdSuggestions = ['2025-12-10', '>2025-12-07', '>2025-12-01', '>2025-01-01'];

const parseFormFromQuery = (q: string): SearchFormState => {
  // location: 뒤에 오는 문자열(공백 포함)을 다음 qualifier(type:/in:/repos:/location:) 전까지 캡처
  let location = '';
  const locationMatch = q.match(/(?:^|\s)location:([\s\S]*?)(?=(\s+\w+:|$))/);

  let cleanedQ = q;
  if (locationMatch) {
    const locRaw = locationMatch[1].trim();
    location = locRaw;
    cleanedQ = cleanedQ.replace(locationMatch[0], ' ');
  }

  const tokens = cleanedQ.trim().split(/\s+/).filter(Boolean);
  const result: string[] = [];

  let accountType: AccountType = 'all';
  let nameField: NameField = 'all';
  let repos = { min: 0, max: 10000 };
  let language = '';
  let followers = { min: 0, max: 10000 };
  let created = '';
  let sponsorable = false;

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
      const [min, max] = range?.split('..').map(Number) ?? [0, 10000];
      repos = { min, max };
      continue;
    }

    if (token.startsWith('language:')) {
      const [, lang] = token.split(':');
      language = lang;
      continue;
    }

    if (token.startsWith('followers:')) {
      const [, range] = token.split(':');
      const [min, max] = range?.split('..').map(Number) ?? [0, 10000];
      followers = { min, max };
      continue;
    }

    if (token.startsWith('created:')) {
      const [, expr] = token.split(':');
      created = expr;
      continue;
    }

    if (token === 'is:sponsorable') {
      sponsorable = true;
      continue;
    }

    result.push(token);
  }

  return {
    keyword: result.join(' '),
    accountType,
    nameField,
    repos,
    location,
    language,
    followers,
    created,
    sponsorable,
  };
};

const buildQueryFromForm = (formObj: Record<string, FormDataEntryValue>): string => {
  const terms: string[] = [];

  const q = (formObj.q as string) ?? '';
  const accountType = formObj.accountType ?? 'all';
  const nameField = formObj.nameField ?? 'all';

  const reposEnabled = formObj.reposEnabled;
  const repos = formObj.repos;
  const followersEnabled = formObj.followersEnabled;
  const followers = formObj.followers;
  const sponsorable = formObj.sponsorable as string | undefined;
  const location = formObj.location;
  const language = formObj.language as string | undefined;
  const created = (formObj.created as string | undefined) || '';

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

  // 3. 위치별 검색 (location:)
  if (location) {
    terms.push(`location:${encodeURIComponent(location as string)}`);
  }

  // 4. 사용 언어로 검색 (language:)
  if (language) {
    terms.push(`language:${language}`);
  }

  // 5. 개인 계정을 만든 시점별 검색 (created:)
  if (created) {
    terms.push(`created:${created}`);
  }

  // 6. 후원 가능 여부 (is:sponsorable)
  if (sponsorable) {
    terms.push('is:sponsorable');
  }

  // 7. 팔로워 수로 검색 (followers:)
  if (followersEnabled) {
    terms.push(`followers:${followers}`);
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
  const [reposEnabled, setReposEnabled] = useState(persistParams.repos.min !== 0 || persistParams.repos.max !== 10000);

  const [followersRange, setFollowersRange] = useState<[number, number]>([
    persistParams.followers.min,
    persistParams.followers.max,
  ]);
  const [followersEnabled, setFollowersEnabled] = useState(
    persistParams.followers.min !== 0 || persistParams.followers.max !== 10000,
  );

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

        {/* 위치별 검색 (location:) + 사용 언어로 검색 (language:) - 2컬럼 레이아웃 */}
        <Box className="w-full flex flex-col md:flex-row gap-4 mb-1">
          {/* 위치별 검색 (location:) */}
          <FormControl component="fieldset" className="w-full md:flex-1">
            <Typography variant="subtitle2" className="mb-1">
              위치별 검색
            </Typography>
            <Autocomplete<CountryOption, false, false, true>
              freeSolo
              options={Object.entries(countries).map(([code, name]) => ({ code, name }))}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
              defaultValue={persistParams.location || ''}
              onChange={(_, value) => {
                const form = document.querySelector('form');
                const input = form!.querySelector('input[name="location"]') as HTMLInputElement | null;
                if (value && typeof value !== 'string') {
                  input!.value = value.name;
                } else {
                  input!.value = value || '';
                }
              }}
              renderOption={(props, option: CountryOption) => (
                <li {...props} key={option.code}>
                  {option.name} ({option.code.toUpperCase()})
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  placeholder="국가를 입력하세요"
                  name="locationDisplay"
                  autoComplete="off"
                />
              )}
            />
            <input type="hidden" name="location" defaultValue={persistParams.location} />
          </FormControl>

          {/* 사용 언어로 검색 (language:) */}
          <FormControl component="fieldset" className="w-full md:flex-1">
            <Typography variant="subtitle2" className="mb-1">
              사용 언어로 검색
            </Typography>
            <Autocomplete<string, false, false, true>
              freeSolo
              options={languages}
              defaultValue={persistParams.language || ''}
              onChange={(_, value) => {
                const form = document.querySelector('form');
                const input = form!.querySelector('input[name="language"]') as HTMLInputElement | null;
                input!.value = value ?? '';
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  placeholder="예: TypeScript, JavaScript, Python"
                  name="languageDisplay"
                  autoComplete="off"
                />
              )}
            />
            <input type="hidden" name="language" defaultValue={persistParams.language} />
          </FormControl>
        </Box>

        {/* 개인 계정을 만든 시점별 검색 (created:) */}
        <FormControl component="fieldset" className="w-full mb-1">
          <Typography variant="subtitle2" className="mb-1">
            개인 계정 생성일
          </Typography>
          <Autocomplete<string, false, false, true>
            freeSolo
            options={createdSuggestions}
            defaultValue={persistParams.created || ''}
            onChange={(_, value) => {
              const form = document.querySelector('form');
              const input = form!.querySelector('input[name="created"]') as HTMLInputElement | null;
              if (!input) return;
              input.value = value ?? '';
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                placeholder="예: 2025-12-10, >2025-12-07"
                name="createdDisplay"
                autoComplete="off"
              />
            )}
          />
          <input type="hidden" name="created" defaultValue={persistParams.created} />
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
                    const input = form!.querySelector('input[name="repos"]') as HTMLInputElement | null;
                    input!.value = checked ? `${reposRange[0]}..${reposRange[1]}` : '0..10000';
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
                max={10000}
                valueLabelDisplay="auto"
                onChange={(_, value) => {
                  const [min, max] = value as number[];
                  setReposRange([min, max]);
                  const form = document.querySelector('form');
                  const input = form!.querySelector('input[name="repos"]') as HTMLInputElement | null;
                  input!.value = `${min}..${max}`;
                }}
                disabled={!reposEnabled}
              />
            </Box>

            <input type="hidden" name="repos" defaultValue={`${reposRange[0]}..${reposRange[1]}`} />
          </Box>
        </FormControl>

        <FormControl component="fieldset" className="w-full mt-3">
          <Box className="flex items-center justify-between mb-1">
            <Typography variant="subtitle2">팔로워 수</Typography>
          </Box>
          <Box className="gap-2">
            <FormControlLabel
              control={
                <Checkbox
                  name="followersEnabled"
                  checked={followersEnabled}
                  onChange={(_, checked) => {
                    setFollowersEnabled(checked);
                    const form = document.querySelector('form');
                    const input = form!.querySelector('input[name="followers"]') as HTMLInputElement | null;
                    if (input) {
                      input.value = checked ? `${followersRange[0]}..${followersRange[1]}` : '0..10000';
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
                value={followersRange}
                min={0}
                max={10000}
                valueLabelDisplay="auto"
                onChange={(_, value) => {
                  const [min, max] = value as number[];
                  setFollowersRange([min, max]);
                  const form = document.querySelector('form');
                  const input = form!.querySelector('input[name="followers"]') as HTMLInputElement | null;
                  if (input) {
                    input.value = `${min}..${max}`;
                  }
                }}
                disabled={!followersEnabled}
              />
            </Box>
            <input type="hidden" name="followers" defaultValue={`${followersRange[0]}..${followersRange[1]}`} />
          </Box>
        </FormControl>

        <FormControl component="fieldset" className="w-full mt-3">
          <Typography variant="subtitle2" className="mb-1">
            후원 가능 여부
          </Typography>
          <FormControlLabel
            control={<Checkbox name="sponsorable" defaultChecked={persistParams.sponsorable} size="small" />}
            label="후원 가능한 계정만 (is:sponsorable)"
          />
        </FormControl>
      </Paper>
    </Box>
  );
};

export default Search;
