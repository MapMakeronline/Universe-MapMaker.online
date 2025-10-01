'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Visibility,
  VisibilityOff,
  Save,
} from '@mui/icons-material';

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
  const [currentTab, setCurrentTab] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    username: 'Terenyinwestycyjne',
    firstName: '',
    lastName: '',
    city: '',
    postalCode: '',
    nip: '',
    email: 'terenyinwest@gmail.com',
    surname: '',
    address: '',
    companyName: '',
  });

  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newsletter: false,
    appNotifications: false,
    emailUpdates: true,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
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

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordSave = () => {
    // Implement password change logic
    setPasswordSettings({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
          Ustawienia
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Zarządzaj ustawieniami swojego konta
        </Typography>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Ustawienia zostały zapisane pomyślnie!
        </Alert>
      )}

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab 
              icon={<Person />} 
              label="Generalne" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              icon={<Security />} 
              label="Prywatność" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              icon={<Notifications />} 
              label="Powiadomienia" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Box>

        {/* General Settings Tab */}
        <TabPanel value={currentTab} index={0}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Informacje osobiste
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nazwa użytkownika"
                  value={generalSettings.username}
                  onChange={handleGeneralChange('username')}
                  variant="outlined"
                />
              </Grid>
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
                  value={generalSettings.surname}
                  onChange={handleGeneralChange('surname')}
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
                  value={generalSettings.postalCode}
                  onChange={handleGeneralChange('postalCode')}
                  variant="outlined"
                  placeholder="00-000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nazwa firmy"
                  value={generalSettings.companyName}
                  onChange={handleGeneralChange('companyName')}
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

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                sx={{ textTransform: 'none', px: 3 }}
              >
                Zaktualizuj dane
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Privacy Settings Tab */}
        <TabPanel value={currentTab} index={1}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
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
                  value={passwordSettings.currentPassword}
                  onChange={handlePasswordChange('currentPassword')}
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
                  value={passwordSettings.newPassword}
                  onChange={handlePasswordChange('newPassword')}
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

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <FormControlLabel
                  control={<Switch checked={false} />}
                  label="Wyloguj ze wszystkich urządzeń"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Po zmianie hasła zostaniesz wylogowany ze wszystkich urządzeń
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handlePasswordSave}
                sx={{ textTransform: 'none', px: 3 }}
                disabled={!passwordSettings.currentPassword || !passwordSettings.newPassword || passwordSettings.newPassword !== passwordSettings.confirmPassword}
              >
                Zmień hasło
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Notifications Settings Tab */}
        <TabPanel value={currentTab} index={2}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Preferencje powiadomień
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={notificationSettings.newsletter}
                    onChange={handleNotificationChange('newsletter')}
                  />
                }
                label="Newsletter"
                sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', ml: 0 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 0 }}>
                Otrzymuj najnowsze wiadomości o produktach i funkcjach
              </Typography>

              <FormControlLabel
                control={
                  <Switch 
                    checked={notificationSettings.appNotifications}
                    onChange={handleNotificationChange('appNotifications')}
                  />
                }
                label="Powiadomienia w aplikacji"
                sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', ml: 0 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 0 }}>
                Otrzymuj powiadomienia o aktywności w aplikacji
              </Typography>

              <FormControlLabel
                control={
                  <Switch 
                    checked={true}
                    disabled
                  />
                }
                label="Samouczek"
                sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', ml: 0 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, ml: 0 }}>
                Powiadomienia pomocnicze (zawsze włączone)
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                sx={{ textTransform: 'none', px: 3 }}
              >
                Zapisz zmiany
              </Button>
            </Box>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}