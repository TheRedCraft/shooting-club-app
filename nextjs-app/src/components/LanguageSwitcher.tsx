'use client';

import React from 'react';
import { IconButton, Menu, MenuItem, Box, Typography } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: 'de' | 'en') => {
    setLanguage(lang);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        color="inherit"
      >
        <LanguageIcon />
        <Typography variant="body2" sx={{ ml: 0.5, textTransform: 'uppercase' }}>
          {language}
        </Typography>
      </IconButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('de')}
          selected={language === 'de'}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🇩🇪 Deutsch
          </Box>
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🇬🇧 English
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}

