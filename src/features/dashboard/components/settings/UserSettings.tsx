'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import Person from '@mui/icons-material/Person';
import Security from '@mui/icons-material/Security';
import Notifications from '@mui/icons-material/Notifications';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Save from '@mui/icons-material/Save';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { useAppSelector } from '@/redux/hooks';
import { useUpdateProfileMutation, useChangePasswordMutation } from '@/backend/users';
import LoginRequiredGuard from '@/features/autoryzacja/LoginRequiredGuard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserSettings() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // RTK Query hooks (only mutations - no GET endpoint available)
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const [currentTab, setCurrentTab] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string>('');

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    firstName: '',
    lastName: '',
    city: '',
    zip_code: '',
    nip: '',
    email: '',
    address: '',
    company_name: '',
  });

  const [passwordSettings, setPasswordSettings] = useState({
    old_password: '',
    new_password: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newsletter: false,
    appNotifications: false,
    emailUpdates: true,
  });

  // Load user data from Redux (populated on login)
  useEffect(() => {
    if (user) {
      setGeneralSettings({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        city: user.city || '',
        zip_code: user.zip_code || '',
        nip: user.nip || '',
        email: user.email || '',
        address: user.address || '',
        company_name: user.company_name || '',
      });
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleGeneralChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handlePasswordChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleNotificationChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleSave = async () => {
    console.log('🔵 handleSave called!', generalSettings);
    setSaveError('');
    setSaveSuccess(false);

    try {
      console.log('🔵 Sending PUT request...');
      const response = await updateProfile({
        first_name: generalSettings.firstName,
        last_name: generalSettings.lastName,
        email: generalSettings.email,
        city: generalSettings.city,
        zip_code: generalSettings.zip_code,
        nip: generalSettings.nip,
        address: generalSettings.address,
        company_name: generalSettings.company_name,
      }).unwrap();

      console.log('✅ Profile updated successfully:', response);
      console.log('✅ Redux and localStorage auto-updated by RTK Query');

      // RTK Query onQueryStarted already updated Redux and localStorage
      // Now update local form state to show the new values immediately
      if (response.user) {
        setGeneralSettings({
          firstName: response.user.first_name || '',
          lastName: response.user.last_name || '',
          city: response.user.city || '',
          zip_code: response.user.zip_code || '',
          nip: response.user.nip || '',
          email: response.user.email || '',
          address: response.user.address || '',
          company_name: response.user.company_name || '',
        });
      }

      // Scroll to top to show success alert
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setSaveSuccess(true);
    } catch (err: any) {
      console.error('❌ Failed to update profile:', err);
      setSaveError(err?.data?.message || 'Nie udało się zaktualizować profilu');
    }
  };

  const handlePasswordSave = async () => {
    setSaveError('');
    setSaveSuccess(false);

    // Validate passwords match
    if (passwordSettings.new_password !== passwordSettings.confirmPassword) {
      setSaveError('Nowe hasła nie są identyczne');
      return;
    }

    if (!passwordSettings.old_password || !passwordSettings.new_password) {
      setSaveError('Wszystkie pola są wymagane');
      return;
    }

    try {
      await changePassword({
        old_password: passwordSettings.old_password,
        new_password: passwordSettings.new_password,
      }).unwrap();

      setPasswordSettings({
        old_password: '',
        new_password: '',
        confirmPassword: '',
      });

      // Scroll to top to show success alert
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setSaveSuccess(true);
    } catch (err: any) {
      console.error('Failed to change password:', err);

      // Backend zwraca HTML error page (500) zamiast JSON dla błędów walidacji
      if (err?.status === 'PARSING_ERROR' || err?.originalStatus === 500) {
        // Try to extract Django validation error from HTML response
        const errorText = err?.error || '';

        // Check for common Django password validation errors
        if (errorText.includes('too similar to the username')) {
          setSaveError('Hasło jest zbyt podobne do nazwy użytkownika. Wybierz bardziej unikalne hasło.');
        } else if (errorText.includes('too common')) {
          setSaveError('To hasło jest zbyt popularne. Wybierz bardziej unikalne hasło.');
        } else if (errorText.includes('too short')) {
          setSaveError('Hasło jest zbyt krótkie. Musi zawierać co najmniej 8 znaków.');
        } else if (errorText.includes('entirely numeric')) {
          setSaveError('Hasło nie może składać się wyłącznie z cyfr.');
        } else if (errorText.includes('incorrect')) {
          setSaveError('Obecne hasło jest nieprawidłowe.');
        } else {
          setSaveError('Hasło nie spełnia wymagań bezpieczeństwa. Użyj silnego hasła (min. 8 znaków, niepodobne do loginu).');
        }
      } else if (err?.data?.message) {
        // Backend zwrócił JSON z message
        const message = err.data.message;
        if (message.includes('incorrect') || message.includes('nieprawidłowe')) {
          setSaveError('Obecne hasło jest nieprawidłowe.');
        } else {
          setSaveError(message);
        }
      } else if (err?.status === 400) {
        setSaveError('Obecne hasło jest nieprawidłowe lub nowe hasło nie spełnia wymagań.');
      } else {
        setSaveError('Nie udało się zmienić hasła. Sprawdź czy obecne hasło jest poprawne.');
      }
    }
  };

  return (
    <LoginRequiredGuard
      isLoggedIn={isAuthenticated}
      title="Zaloguj się, aby zmienić ustawienia"
      message="Ta sekcja wymaga zalogowania. Utwórz konto lub zaloguj się, aby zarządzać ustawieniami swojego konta."
    >
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="700" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Ustawienia
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Zarządzaj ustawieniami swojego konta
        </Typography>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaveSuccess(false)}>
          Ustawienia zostały zapisane pomyślnie!
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError('')}>
          {saveError}
        </Alert>
      )}

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            allowScrollButtonsMobile
          >
            <Tab
              icon={isMobile ? undefined : <Person />}
              label="Generalne"
              iconPosition="start"
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 2, sm: 3 }
              }}
            />
            <Tab
              icon={isMobile ? undefined : <Security />}
              label="Prywatność"
              iconPosition="start"
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 2, sm: 3 }
              }}
            />
            <Tab
              icon={isMobile ? undefined : <Notifications />}
              label="Powiadomienia"
              iconPosition="start"
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 2, sm: 3 }
              }}
            />
          </Tabs>
        </Box>

        {/* General Settings Tab */}
        <TabPanel value={currentTab} index={0}>
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={{ maxWidth: 800 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                Informacje osobiste
              </Typography>

              <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="E-mail"
                  value={generalSettings.email}
                  onChange={handleGeneralChange('email')}
                  variant="outlined"
                  type="email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Imię"
                  value={generalSettings.firstName}
                  onChange={handleGeneralChange('firstName')}
                  variant="outlined"
                  placeholder="Wpisz swoje imię"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nazwisko"
                  value={generalSettings.lastName}
                  onChange={handleGeneralChange('lastName')}
                  variant="outlined"
                  placeholder="Wpisz swoje nazwisko"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Miasto"
                  value={generalSettings.city}
                  onChange={handleGeneralChange('city')}
                  variant="outlined"
                  placeholder="Wpisz swoje miasto"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Adres"
                  value={generalSettings.address}
                  onChange={handleGeneralChange('address')}
                  variant="outlined"
                  placeholder="Wpisz swój adres"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Kod pocztowy"
                  value={generalSettings.zip_code}
                  onChange={handleGeneralChange('zip_code')}
                  variant="outlined"
                  placeholder="00-000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nazwa firmy"
                  value={generalSettings.company_name}
                  onChange={handleGeneralChange('company_name')}
                  variant="outlined"
                  placeholder="Wpisz nazwę swojej firmy"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="NIP"
                  value={generalSettings.nip}
                  onChange={handleGeneralChange('nip')}
                  variant="outlined"
                  placeholder="000-000-00-00"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isUpdatingProfile) {
                      handleSave();
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={isUpdatingProfile ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={isUpdatingProfile}
                fullWidth={isMobile}
                sx={{ textTransform: 'none', px: 3 }}
              >
                {isUpdatingProfile ? 'Zapisywanie...' : 'Zaktualizuj dane'}
              </Button>
            </Box>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Privacy Settings Tab */}
        <TabPanel value={currentTab} index={1}>
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={{ maxWidth: 600 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                Zmiana hasła
              </Typography>

              {/* Info Box */}
            <Alert
              severity="info"
              icon={<InfoOutlined />}
              sx={{ mb: 3, bgcolor: 'primary.50', '& .MuiAlert-icon': { color: 'primary.main' } }}
            >
              <Typography variant="body2">
                Twoje hasło musi spełniać następujące wymagania:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                <li>Minimum 8 znaków</li>
                <li>Nie może być zbyt podobne do nazwy użytkownika</li>
                <li>Nie może być zbyt popularne (np. "password123")</li>
                <li>Nie może składać się wyłącznie z cyfr</li>
              </Box>
            </Alert>

            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Obecne hasło"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordSettings.old_password}
                onChange={handlePasswordChange('old_password')}
                variant="outlined"
                placeholder="Wpisz obecne hasło"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                        aria-label="pokaż/ukryj obecne hasło"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Nowe hasło"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordSettings.new_password}
                onChange={handlePasswordChange('new_password')}
                variant="outlined"
                placeholder="Wpisz nowe hasło"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        aria-label="pokaż/ukryj nowe hasło"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Powtórz nowe hasło"
                type="password"
                value={passwordSettings.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                variant="outlined"
                placeholder="Wpisz ponownie nowe hasło"
                error={passwordSettings.confirmPassword !== '' && passwordSettings.new_password !== passwordSettings.confirmPassword}
                helperText={
                  passwordSettings.confirmPassword !== '' && passwordSettings.new_password !== passwordSettings.confirmPassword
                    ? 'Hasła nie są identyczne'
                    : ''
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isChangingPassword && passwordSettings.old_password && passwordSettings.new_password && passwordSettings.new_password === passwordSettings.confirmPassword) {
                    handlePasswordSave();
                  }
                }}
              />
            </Stack>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={isChangingPassword ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handlePasswordSave}
                fullWidth={isMobile}
                sx={{ textTransform: 'none', px: 3 }}
                disabled={isChangingPassword || !passwordSettings.old_password || !passwordSettings.new_password || passwordSettings.new_password !== passwordSettings.confirmPassword}
              >
                {isChangingPassword ? 'Zapisywanie...' : 'Zmień hasło'}
              </Button>
            </Box>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Notifications Settings Tab */}
        <TabPanel value={currentTab} index={2}>
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={{ maxWidth: 600 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                Preferencje powiadomień
              </Typography>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Switch
                    checked={notificationSettings.newsletter}
                    onChange={handleNotificationChange('newsletter')}
                  />
                  <Typography variant="body1" fontWeight="500">
                    Newsletter
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 6 }, pl: { xs: 0, sm: 0 } }}>
                  Otrzymuj najnowsze wiadomości o produktach i funkcjach
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Switch
                    checked={notificationSettings.appNotifications}
                    onChange={handleNotificationChange('appNotifications')}
                  />
                  <Typography variant="body1" fontWeight="500">
                    Powiadomienia w aplikacji
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 6 } }}>
                  Otrzymuj powiadomienia o aktywności w aplikacji
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Switch
                    checked={true}
                    disabled
                  />
                  <Typography variant="body1" fontWeight="500">
                    Samouczek
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 6 } }}>
                  Powiadomienia pomocnicze (zawsze włączone)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                fullWidth={isMobile}
                sx={{ textTransform: 'none', px: 3 }}
              >
                Zapisz zmiany
              </Button>
            </Box>
            </Box>
          </CardContent>
        </TabPanel>
      </Card>
      </Box>
    </LoginRequiredGuard>
  );
}