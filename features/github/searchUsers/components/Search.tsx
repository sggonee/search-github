'use client';

import useSearch from '@/shared/hooks/useSearch';
import { getCountries } from '@/shared/policy/country';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useMemo } from 'react';
const advancedFilters = [
  { key: 'organization', label: 'Organization', targetId: 'filter-organization' },
  { key: 'user', label: 'User', targetId: 'filter-user' },
  { key: 'in-login', label: 'Username', targetId: 'filter-in-login' },
  { key: 'in-name', label: 'Full name', targetId: 'filter-in-name' },
  { key: 'in-email', label: 'Email', targetId: 'filter-in-email' },
  { key: 'repos', label: 'Number of repositories', targetId: 'filter-repos' },
  { key: 'followers', label: 'Number of followers', targetId: 'filter-followers' },
  { key: 'location', label: 'Location', targetId: 'filter-location' },
  { key: 'language', label: 'Language', targetId: 'filter-language' },
  { key: 'created', label: 'Creation date', targetId: 'filter-created' },
  { key: 'sponsorable', label: 'Sponsorable', targetId: 'filter-sponsorable' },
];

const SearchFilter: Record<string, { token: string; range: string[] }> = {
  organization: { token: 'type:org', range: ['type:user', 'type:org'] },
  user: { token: 'type:user', range: ['type:user', 'type:org'] },

  'in-login': { token: 'in:login', range: ['in:login', 'in:name', 'in:email'] },
  'in-name': { token: 'in:name', range: ['in:login', 'in:name', 'in:email'] },
  'in-email': { token: 'in:email', range: ['in:login', 'in:name', 'in:email'] },

  location: { token: 'location:', range: ['location:'] },
  language: { token: 'language:', range: ['language:'] },
  created: { token: 'created:', range: ['created:'] },

  repos: { token: 'repos:', range: ['repos:'] },
  followers: { token: 'followers:', range: ['followers:'] },

  sponsorable: { token: 'is:sponsorable', range: ['is:sponsorable'] },
};

// Country option type
interface CountryOption {
  code: string;
  name: string;
}

type AccountType = 'all' | 'user' | 'org';

type SearchFormState = {
  keyword: string;
  accountType: AccountType;
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

  console.log('result', result);

  return {
    keyword: result.join(' '),
    accountType,
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

  const reposEnabled = formObj.reposEnabled;
  const repos = formObj.repos;
  const followersEnabled = formObj.followersEnabled;
  const followers = formObj.followers;
  const sponsorable = formObj.sponsorable as string | undefined;
  const location = formObj.location;
  const language = formObj.language as string | undefined;
  const created = (formObj.created as string | undefined) || '';

  // 1. 키워드 (q는 required이므로 항상 존재)
  if (q) {
    terms.push(q);
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

  /**
   * 공통 토큰 필터 함수
   * - 현재 q 인풋을 읽어서 공백 기준으로 토큰화
   * - groupTokens 에 포함된 토큰을 모두 제거
   * - snippet 이 이미 없으면 마지막에 추가
   */
  const applySingleTokenFilter = (snippet: string, groupTokens: string[]) => {
    const input = document.querySelector('input[name="q"]') as HTMLInputElement | null;
    if (!input) return;

    const tokens = input.value.trim().split(/\s+/).filter(Boolean);
    const filtered = tokens.filter((t) => !groupTokens.includes(t));

    if (!filtered.includes(snippet)) {
      filtered.push(snippet);
    }

    input.value = filtered.join(' ');
    input.focus();
  };

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

        {/* Advanced filters (GitHub-style) */}
        <Box className="mt-4">
          <Typography variant="subtitle2" className="mb-2">
            Advanced
          </Typography>
          <List dense disablePadding>
            {advancedFilters.map((item) => (
              <ListItemButton
                key={item.key}
                className="px-1"
                onClick={() => {
                  const config = SearchFilter[item.key];
                  if (config) {
                    applySingleTokenFilter(config.token, config.range);
                  }

                  // 스크롤/포커스 등 추가 UX는 이후 단계에서 따로 다룸
                }}
              >
                <ListItemIcon className="min-w-0 mr-2">
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Paper>
    </Box>
  );
};

export default Search;
