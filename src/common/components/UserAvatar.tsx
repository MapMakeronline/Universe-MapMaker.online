'use client';

import React from 'react';
import { Avatar, SxProps, Theme } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { User } from '@/backend/types';

interface UserAvatarProps {
  user?: User | null;
  isAuthenticated?: boolean;
  size?: number;
  sx?: SxProps<Theme>;
  showIcon?: boolean; // Show AccountCircle icon if no avatar
}

/**
 * Reusable UserAvatar component
 *
 * Displays user's Google avatar or fallback AccountCircle icon
 * Used consistently across Dashboard, Map, and other views
 *
 * @example
 * // Small avatar in IconButton
 * <UserAvatar user={user} isAuthenticated={true} size={32} />
 *
 * @example
 * // Large avatar in Menu header
 * <UserAvatar user={user} size={40} showIcon={false} />
 *
 * @example
 * // FAB avatar on Map
 * <UserAvatar user={user} isAuthenticated={true} size={56} />
 */
export default function UserAvatar({
  user,
  isAuthenticated = false,
  size = 40,
  sx = {},
  showIcon = true,
}: UserAvatarProps) {
  const hasAvatar = user?.avatar;

  return (
    <Avatar
      src={hasAvatar ? user.avatar : undefined}
      sx={{
        width: size,
        height: size,
        bgcolor: isAuthenticated ? '#10b981' : '#f97316',
        transition: 'all 0.3s ease',
        ...sx,
      }}
    >
      {!hasAvatar && showIcon && <AccountCircle sx={{ fontSize: size * 0.875 }} />}
    </Avatar>
  );
}
