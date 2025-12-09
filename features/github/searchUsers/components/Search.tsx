'use client';

import useSearch from '@/shared/hooks/useSearch';
import SearchIcon from '@mui/icons-material/Search';
import { Box, IconButton, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import { FormEvent, useState } from 'react';

const Search = () => {
  const { updateParams } = useSearch();
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateParams({ q: value || '' });
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

      <Paper component="form" onSubmit={handleSubmit} elevation={3} className="w-full px-3 py-2">
        <TextField
          fullWidth
          variant="standard"
          placeholder="사용자 이름 또는 키워드를 입력하세요"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
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
      </Paper>
    </Box>
  );
};

export default Search;
