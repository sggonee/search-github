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
import { AdvancedFilters, SearchFilter } from '../policy/search';
import SortControl from './SortControl';

const Header = () => {
  const { updateParams } = useSearch();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const [filterTokens, setFilterTokens] = useState<string[]>(() => q.trim().split(/\s+/).filter(Boolean));

  const applySingleTokenFilter = (snippet: string, groupTokens: string[]) => {
    const input = document.querySelector('input[name="q"]') as HTMLInputElement | null;
    if (!input) return;

    const tokens = input.value.trim().split(/\s+/).filter(Boolean);

    if (tokens.includes(snippet)) {
      const next = tokens.filter((t) => t !== snippet);
      input.value = next.join(' ');
      input.focus();
      setFilterTokens(next);
      return;
    }

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
      <Box className="mt-4 mb-4 font-semibold">
        <Typography variant="h5" component="h1">
          GitHub 사용자 검색
        </Typography>
      </Box>

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
              startAdornment: (
                <Box className="flex items-center gap-2 mr-2">
                  <SortControl />
                </Box>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box className="flex items-center gap-1">
                    <IconButton type="submit" size="small" aria-label="검색">
                      <SearchIcon />
                    </IconButton>
                  </Box>
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
            {AdvancedFilters.map((item) => {
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
