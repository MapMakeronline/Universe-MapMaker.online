/**
 * OPTIMIZED UI COMPONENTS
 *
 * Reusable, memoized components following MUI best practices
 *
 * Key optimizations:
 * 1. React.memo() to prevent unnecessary re-renders
 * 2. Path imports from MUI (faster dev builds)
 * 3. Proper TypeScript typing
 * 4. Consistent styling using theme
 * 5. Accessibility support (ARIA labels, keyboard navigation)
 */

import { memo, forwardRef } from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import Button, { ButtonProps } from '@mui/material/Button';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography, { TypographyProps } from '@mui/material/Typography';
import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';
import Alert, { AlertProps } from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

/**
 * Centered loading spinner
 */
export const LoadingSpinner = memo(
  forwardRef<HTMLDivElement, CircularProgressProps & { message?: string }>(
    ({ message, ...props }, ref) => {
      const theme = useTheme();

      return (
        <Box
          ref={ref}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 4,
          }}
        >
          <CircularProgress {...props} />
          {message && (
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          )}
        </Box>
      );
    }
  )
);
LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Full-page loading overlay
 */
export const LoadingOverlay = memo(
  forwardRef<HTMLDivElement, CircularProgressProps & { message?: string }>(
    ({ message, ...props }, ref) => {
      return (
        <Box
          ref={ref}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 9999,
          }}
        >
          <LoadingSpinner message={message} {...props} />
        </Box>
      );
    }
  )
);
LoadingOverlay.displayName = 'LoadingOverlay';

// ============================================================================
// ERROR COMPONENTS
// ============================================================================

/**
 * Error message with optional retry button
 */
interface ErrorMessageProps extends Omit<AlertProps, 'severity'> {
  error: Error | string;
  onRetry?: () => void;
}

export const ErrorMessage = memo(
  forwardRef<HTMLDivElement, ErrorMessageProps>(({ error, onRetry, ...props }, ref) => {
    const errorMessage = typeof error === 'string' ? error : error.message;

    return (
      <Alert ref={ref} severity="error" {...props}>
        <Typography variant="body2">{errorMessage}</Typography>
        {onRetry && (
          <Button
            size="small"
            onClick={onRetry}
            sx={{ mt: 1 }}
            variant="outlined"
            color="inherit"
          >
            Spróbuj ponownie
          </Button>
        )}
      </Alert>
    );
  })
);
ErrorMessage.displayName = 'ErrorMessage';

// ============================================================================
// FORM COMPONENTS
// ============================================================================

/**
 * Form field with label
 */
interface FormFieldProps extends BoxProps {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormField = memo(
  forwardRef<HTMLDivElement, FormFieldProps>(
    ({ label, required, error, children, ...props }, ref) => {
      return (
        <Box ref={ref} sx={{ mb: 2, ...props.sx }} {...props}>
          <Typography
            variant="body2"
            sx={{
              mb: 0.5,
              fontWeight: 500,
              color: error ? 'error.main' : 'text.primary',
            }}
          >
            {label}
            {required && (
              <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
                *
              </Typography>
            )}
          </Typography>
          {children}
          {error && (
            <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
              {error}
            </Typography>
          )}
        </Box>
      );
    }
  )
);
FormField.displayName = 'FormField';

/**
 * Optimized text field with common defaults
 */
export const OptimizedTextField = memo(
  forwardRef<HTMLDivElement, TextFieldProps>((props, ref) => {
    return (
      <TextField
        ref={ref}
        fullWidth
        size="small"
        variant="outlined"
        {...props}
      />
    );
  })
);
OptimizedTextField.displayName = 'OptimizedTextField';

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

/**
 * Centered container
 */
export const CenteredBox = memo(
  forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...props.sx,
        }}
        {...props}
      />
    );
  })
);
CenteredBox.displayName = 'CenteredBox';

/**
 * Flex row container
 */
export const FlexRow = memo(
  forwardRef<HTMLDivElement, BoxProps & { gap?: number }>((props, ref) => {
    const { gap = 2, ...rest } = props;
    return (
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap,
          ...rest.sx,
        }}
        {...rest}
      />
    );
  })
);
FlexRow.displayName = 'FlexRow';

/**
 * Flex column container
 */
export const FlexColumn = memo(
  forwardRef<HTMLDivElement, BoxProps & { gap?: number }>((props, ref) => {
    const { gap = 2, ...rest } = props;
    return (
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap,
          ...rest.sx,
        }}
        {...rest}
      />
    );
  })
);
FlexColumn.displayName = 'FlexColumn';

/**
 * Scrollable container with custom scrollbar
 */
export const ScrollableBox = memo(
  forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
    const theme = useTheme();

    return (
      <Box
        ref={ref}
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          // Custom scrollbar styling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: theme.palette.grey[100],
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: theme.palette.grey[400],
            borderRadius: '4px',
            '&:hover': {
              bgcolor: theme.palette.grey[600],
            },
          },
          ...props.sx,
        }}
        {...props}
      />
    );
  })
);
ScrollableBox.displayName = 'ScrollableBox';

// ============================================================================
// CARD COMPONENTS
// ============================================================================

/**
 * Clickable card with hover effect
 */
export const ClickableCard = memo(
  forwardRef<HTMLDivElement, BoxProps & { onClick?: () => void }>(({ onClick, ...props }, ref) => {
    const theme = useTheme();

    return (
      <Box
        ref={ref}
        onClick={onClick}
        sx={{
          p: 2,
          borderRadius: theme.shape.borderRadius,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.grey[200]}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.short,
          }),
          '&:hover': onClick
            ? {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-2px)',
              }
            : {},
          ...props.sx,
        }}
        {...props}
      />
    );
  })
);
ClickableCard.displayName = 'ClickableCard';

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

/**
 * Primary action button
 */
export const PrimaryButton = memo(
  forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    return (
      <Button
        ref={ref}
        variant="contained"
        color="primary"
        disableElevation
        {...props}
      />
    );
  })
);
PrimaryButton.displayName = 'PrimaryButton';

/**
 * Secondary action button
 */
export const SecondaryButton = memo(
  forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    return (
      <Button
        ref={ref}
        variant="outlined"
        color="primary"
        {...props}
      />
    );
  })
);
SecondaryButton.displayName = 'SecondaryButton';

/**
 * Danger button (for delete actions)
 */
export const DangerButton = memo(
  forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    return (
      <Button
        ref={ref}
        variant="contained"
        color="error"
        disableElevation
        {...props}
      />
    );
  })
);
DangerButton.displayName = 'DangerButton';

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

/**
 * Empty state with icon and message
 */
interface EmptyStateProps extends BoxProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = memo(
  forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ icon, title, description, action, ...props }, ref) => {
      return (
        <Box
          ref={ref}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            textAlign: 'center',
            ...props.sx,
          }}
          {...props}
        >
          {icon && (
            <Box sx={{ fontSize: '48px', color: 'text.secondary', mb: 2 }}>{icon}</Box>
          )}
          <Typography variant="h6" sx={{ mb: 1 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}
          {action}
        </Box>
      );
    }
  )
);
EmptyState.displayName = 'EmptyState';

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  LoadingSpinner,
  LoadingOverlay,
  ErrorMessage,
  FormField,
  OptimizedTextField,
  CenteredBox,
  FlexRow,
  FlexColumn,
  ScrollableBox,
  ClickableCard,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  EmptyState,
};
