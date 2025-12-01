import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import {
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon
} from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  loading?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  loading = false
}: PaginationProps) {
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mt: 3,
        mb: 2,
        px: 2
      }}
    >
      {/* Info Text */}
      {totalItems !== undefined && itemsPerPage !== undefined && (
        <Typography variant="body2" color="text.secondary">
          Seite {currentPage} von {totalPages} ({totalItems} Einträge gesamt)
        </Typography>
      )}

      {/* Pagination Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* First Page */}
        <IconButton
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage || loading}
          size="small"
          aria-label="Erste Seite"
        >
          <FirstPageIcon />
        </IconButton>

        {/* Previous Page */}
        <IconButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || loading}
          size="small"
          aria-label="Vorherige Seite"
        >
          <NavigateBeforeIcon />
        </IconButton>

        {/* Page Numbers */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <Typography
                  key={`ellipsis-${index}`}
                  sx={{ px: 1, display: 'flex', alignItems: 'center' }}
                >
                  ...
                </Typography>
              );
            }

            const page = pageNum as number;
            const isActive = page === currentPage;

            return (
              <Button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={loading}
                variant={isActive ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  minWidth: 40,
                  height: 40,
                  ...(isActive && {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  })
                }}
              >
                {page}
              </Button>
            );
          })}
        </Box>

        {/* Next Page */}
        <IconButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || loading}
          size="small"
          aria-label="Nächste Seite"
        >
          <NavigateNextIcon />
        </IconButton>

        {/* Last Page */}
        <IconButton
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage || loading}
          size="small"
          aria-label="Letzte Seite"
        >
          <LastPageIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

