'use client';

import useSearch from '@/shared/hooks/useSearch';
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
import { FormEvent, useState } from 'react';

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

const Header = () => {
  const { updateParams } = useSearch();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  // 필터 토큰은 URL q로부터 초기화하고, 이후 버튼 클릭 시 함께 업데이트한다.
  const [filterTokens, setFilterTokens] = useState<string[]>(() => q.trim().split(/\s+/).filter(Boolean));

  /**
   * 공통 토큰 필터 함수
   * - 현재 q 인풋을 읽어서 공백 기준으로 토큰화
   * - 같은 그룹(groupTokens)의 토큰을 정리하면서 snippet 을 토글
   *   - snippet 이 그대로 존재하면(예: "followers:"처럼 값이 비어있으면) → 제거
   *   - 존재하지 않으면 그룹 토큰들을 제거하고 snippet 추가
   */
  const applySingleTokenFilter = (snippet: string, groupTokens: string[]) => {
    const input = document.querySelector('input[name="q"]') as HTMLInputElement | null;
    if (!input) return;

    const tokens = input.value.trim().split(/\s+/).filter(Boolean);

    // 1) snippet 이 그대로 존재하면 토글 OFF: 해당 토큰만 제거
    if (tokens.includes(snippet)) {
      const next = tokens.filter((t) => t !== snippet);
      input.value = next.join(' ');
      input.focus();
      setFilterTokens(next);
      return;
    }

    // 2) snippet 이 없으면 토글 ON:
    //    같은 그룹 토큰들을 제거하고 snippet 을 추가
    const filtered = tokens.filter((t) => !groupTokens.includes(t));
    const next = [...filtered, snippet];

    input.value = next.join(' ');
    input.focus();
    setFilterTokens(next);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateParams({ q: (formData.get('q') as string) ?? '' });
  };

  return (
    <Box component="header" className="w-full sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
      <Typography variant="h5" component="h1" className="mb-4 font-semibold">
        GitHub 사용자 검색
      </Typography>

      <Paper key={q} component="form" onSubmit={onSubmit} elevation={3} className="w-full px-3 py-3 space-y-3">
        <TextField
          fullWidth
          variant="standard"
          placeholder="사용자 이름 또는 키워드를 입력하세요"
          defaultValue={q}
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
        <Box className="mt-4">
          <Typography variant="subtitle2" className="mb-2">
            Advanced
          </Typography>
          <List dense disablePadding>
            {advancedFilters.map((item) => {
              const config = SearchFilter[item.key];
              const isActive = config ? filterTokens.includes(config.token) : false;

              return (
                <ListItemButton
                  key={item.key}
                  className="px-1"
                  selected={isActive}
                  onClick={() => config && applySingleTokenFilter(config.token, config.range)}
                >
                  <ListItemIcon className="min-w-0 mr-2">
                    <AddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Paper>
    </Box>
  );
};

export default Header;
