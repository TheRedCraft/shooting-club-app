'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { clubConfig } from '@/lib/config/club';

interface ClubLogoProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2';
  showIcon?: boolean;
  size?: number;
  showName?: boolean;
}

export default function ClubLogo({ variant = 'h6', showIcon = true, size, showName = true }: ClubLogoProps) {
  const hasLogo = clubConfig.logo && clubConfig.logo.trim() !== '';
  
  // Calculate size based on variant if not explicitly provided
  const logoSize = size || (
    variant === 'h1' ? 64 :
    variant === 'h2' ? 56 :
    variant === 'h3' ? 48 :
    variant === 'h4' ? 40 :
    variant === 'h5' ? 32 :
    variant === 'h6' ? 32 :
    24
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1.5,
      flexWrap: 'nowrap',
      justifyContent: 'center',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {hasLogo ? (
        <Image
          src={clubConfig.logo!}
          alt={clubConfig.name}
          width={logoSize}
          height={logoSize}
          style={{ objectFit: 'contain', flexShrink: 0 }}
          unoptimized={clubConfig.logo!.startsWith('http')} // Allow external images
        />
      ) : showIcon ? (
        <Typography component="span" sx={{ fontSize: logoSize, flexShrink: 0 }}>
          🎯
        </Typography>
      ) : null}
      {showName && (
        <Typography 
          variant={variant} 
          component="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexShrink: 1,
            minWidth: 0
          }}
        >
          {clubConfig.name}
        </Typography>
      )}
    </Box>
  );
}

