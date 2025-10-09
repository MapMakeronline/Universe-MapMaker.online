'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Visibility,
  VisibilityOff,
  Save,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { updateUser } from '@/redux/slices/authSlice';
import { unifiedUserApi } from '@/api/endpointy/unified-user';
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
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Load user data on mount
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
    setIsLoading(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const response = await unifiedUserApi.updateProfile({
        first_name: generalSettings.firstName,
        last_name: generalSettings.lastName,
        email: generalSettings.email,
        city: generalSettings.city,
        zip_code: generalSettings.zip_code,
        nip: generalSettings.nip,
        address: generalSettings.address,
        company_name: generalSettings.company_name,
      });

      // Update Redux with new user data
      dispatch(updateUser(response.user));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setSaveError(err.message || 'Nie udało się zaktualizować profilu');
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);

    try {
      await unifiedUserApi.changePassword({
        old_password: passwordSettings.old_password,
        new_password: passwordSettings.new_password,
      });

      setPasswordSettings({
        old_password: '',
        new_password: '',
        confirmPassword: '',
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setSaveError(err.message || 'Nie udało się zmienić hasła');
    } finally {
      setIsLoading(false);
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
        <Alert severity="success" sx={{ mb: 3 }}>
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
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={isLoading}
                fullWidth={isMobile}
                sx={{ textTransform: 'none', px: 3 }}
              >
                {isLoading ? 'Zapisywanie...' : 'Zaktualizuj dane'}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Privacy Settings Tab */}
        <TabPanel value={currentTab} index={1}>
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
              Zmiana hasła
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Twoje hasło musi mieć minimum 8 znaków
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Obecne hasło"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordSettings.old_password}
                  onChange={handlePasswordChange('old_password')}
                  variant="outlined"
                  placeholder="Jakie jest twoje obecne hasło?"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nowe hasło"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordSettings.new_password}
                  onChange={handlePasswordChange('new_password')}
                  variant="outlined"
                  placeholder="Minimum 8 znaków"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Powtórz nowe hasło"
                  type="password"
                  value={passwordSettings.confirmPassword}
                  onChange={handlePasswordChange('confirmPassword')}
                  variant="outlined"
                  placeholder="Wpisz ponownie nowe hasło"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={<Switch checked={false} />}
                label="Wyloguj ze wszystkich urządzeń"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 5 } }}>
                Po zmianie hasła zostaniesz wylogowany ze wszystkich urządzeń
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handlePasswordSave}
                fullWidth={isMobile}
                sx={{ textTransform: 'none', px: 3 }}
                disabled={isLoading || !passwordSettings.old_password || !passwordSettings.new_password || passwordSettings.new_password !== passwordSettings.confirmPassword}
              >
                {isLoading ? 'Zapisywanie...' : 'Zmień hasło'}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Notifications Settings Tab */}
        <TabPanel value={currentTab} index={2}>
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
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
          </CardContent>
        </TabPanel>
      </Card>
      </Box>
    </LoginRequiredGuard>
  );
}