'use client';

import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

/**
 * Skeleton loader dla karty projektu
 *
 * Pokazuje placeholder podczas ładowania danych projektów
 */
export const ProjectCardSkeleton: React.FC = () => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Image skeleton */}
      <Skeleton variant="rectangular" height={200} animation="wave" />

      <CardContent sx={{ flexGrow: 1 }}>
        {/* Title skeleton */}
        <Skeleton
          variant="text"
          width="70%"
          height={32}
          sx={{ mb: 1 }}
          animation="wave"
        />

        {/* Description skeleton - 2 lines */}
        <Skeleton variant="text" width="100%" animation="wave" />
        <Skeleton variant="text" width="85%" animation="wave" />

        {/* Chips skeleton */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Skeleton variant="rounded" width={80} height={24} animation="wave" />
          <Skeleton variant="rounded" width={60} height={24} animation="wave" />
        </Box>

        {/* Stats skeleton */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Skeleton variant="text" width={100} animation="wave" />
          <Skeleton variant="text" width={80} animation="wave" />
        </Box>
      </CardContent>

      <CardActions>
        {/* Action buttons skeleton */}
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          animation="wave"
        />
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          animation="wave"
        />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          animation="wave"
        />
      </CardActions>
    </Card>
  );
};

/**
 * Grid skeletonów - pokazuje wiele kart naraz
 */
export const ProjectsGridSkeleton: React.FC<{ count?: number }> = ({
  count = 6,
}) => {
  return (
    <Grid container spacing={3}>
      {[...Array(count)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <ProjectCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * List view skeleton - dla widoku listy
 */
export const ProjectListItemSkeleton: React.FC = () => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Thumbnail */}
          <Skeleton
            variant="rectangular"
            width={120}
            height={80}
            animation="wave"
          />

          {/* Content */}
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height={28} animation="wave" />
            <Skeleton variant="text" width="100%" animation="wave" />
            <Skeleton variant="text" width="70%" animation="wave" />

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Skeleton
                variant="rounded"
                width={70}
                height={20}
                animation="wave"
              />
              <Skeleton
                variant="rounded"
                width={90}
                height={20}
                animation="wave"
              />
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton
              variant="circular"
              width={36}
              height={36}
              animation="wave"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ProjectsListSkeleton: React.FC<{ count?: number }> = ({
  count = 4,
}) => {
  return (
    <Box>
      {[...Array(count)].map((_, index) => (
        <ProjectListItemSkeleton key={index} />
      ))}
    </Box>
  );
};

/**
 * Skeleton dla statystyk dashboard
 */
export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[...Array(4)].map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" animation="wave" />
              <Skeleton
                variant="text"
                width="80%"
                height={40}
                animation="wave"
              />
              <Skeleton variant="text" width="50%" animation="wave" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ProjectCardSkeleton;
