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
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ContactMail,
  Info,
  Business,
  Email,
  Phone,
  LocationOn,
  Send,
} from '@mui/icons-material';
import { dashboardService } from '@/lib/api/dashboard';

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
      id={`contact-tabpanel-${index}`}
      aria-labelledby={`contact-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Contact() {
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState({
    subject: '',
    name: '',
    email: '',
    message: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitSuccess(false);
    setIsLoading(true);

    try {
      await dashboardService.sendContactForm({
        subject: formData.subject,
        message: formData.message,
      });

      setSubmitSuccess(true);
      setFormData({
        subject: '',
        name: '',
        email: '',
        message: '',
      });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas wysyłania wiadomości');
    } finally {
      setIsLoading(false);
    }
  };

  const companyInfo = {
    name: 'Mapmaker.online Sp. z o.o.',
    nip: '1181623922',
    regon: '017237293',
    address: 'ul. Telefoniczna 46F',
    city: '92-016 Łódź',
    email: 'contact@mapmaker.online',
    phone: '+48 508-655-541',
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
          Kontakt
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Masz pytania? Skontaktuj się z nami
        </Typography>
      </Box>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Wiadomość została wysłana pomyślnie! Odpowiemy wkrótce.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab 
              icon={<ContactMail />} 
              label="Kontakt" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              icon={<Info />} 
              label="Informacje" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              icon={<Business />} 
              label="O MapMaker" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Box>

        {/* Contact Form Tab */}
        <TabPanel value={currentTab} index={0}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Wyślij wiadomość
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Napotkałeś problemy podczas korzystania z aplikacji lub brakuje ci jakiejś
              funkcji, która jest dla Ciebie niezbędna? A może po prostu chcesz się z Nami
              skontaktować? Koniecznie do napisz do Nas!
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              <strong>Twój adres e-mail nie zostanie nigdzie opublikowany.</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Wymagane pola są oznaczone <span style={{ color: 'red' }}>*</span>
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Temat *"
                    value={formData.subject}
                    onChange={handleInputChange('subject')}
                    variant="outlined"
                    placeholder="np. opinia"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Imię i nazwisko"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    variant="outlined"
                    type="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Treść wiadomości *"
                    value={formData.message}
                    onChange={handleInputChange('message')}
                    variant="outlined"
                    multiline
                    rows={6}
                    placeholder="Opisz swoje pytanie lub problem..."
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                  size="large"
                  disabled={isLoading}
                  sx={{
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                  }}
                >
                  {isLoading ? 'Wysyłanie...' : 'Wyślij wiadomość'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Company Info Tab */}
        <TabPanel value={currentTab} index={1}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Dane kontaktowe
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  O spółce
                </Typography>
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Business color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Mapmaker.online Sp. z o.o."
                      secondary="Oficjalna nazwa firmy"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={`NIP: ${companyInfo.nip}`}
                      secondary="Numer identyfikacji podatkowej"
                      sx={{ ml: 7 }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={`REGON: ${companyInfo.regon}`}
                      secondary="Rejestr gospodarki narodowej"
                      sx={{ ml: 7 }}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Kontaktowe
                </Typography>
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Email color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={companyInfo.email}
                      secondary="E-mail"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Phone color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={companyInfo.phone}
                      secondary="Telefon"
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <LocationOn color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${companyInfo.address}, ${companyInfo.city}`}
                      secondary="Adres siedziby"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* About MapMaker Tab */}
        <TabPanel value={currentTab} index={2}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              O MapMaker
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>MapMaker.Online Jest Aplikacją Internetową, Która Pozwala Tworzyć, Edytować I Udostępniać Dane Przestrzenne Jak Nigdy Dotąd.</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Twoja własna baza danych geoprzestrzennych, rozbudowana edycja GIS, niestandardowe subdomeny URL i udostępnianie usług sieciowych. Wszystko to w środowisku pracy online dzięki najnowszym urządzeniom.
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Przenosimy GIS Na Wyższy Poziom &ndash; Online. Naszym Celem Jest Pokazanie, Że GIS Online Nie Musi Być Ograniczony.</strong>
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Skorzystaj z wielu przydatnych narzędzi GIS, takich jak zaawansowana transformacja geometrii, manipulacja i analiza danych, georeferncja online i inne niestandardowe narzędzia.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Główne funkcje:
            </Typography>

            <List>
              <ListItem>
                <ListItemText 
                  primary="Edytor map online"
                  secondary="Twórz i edytuj mapy bezpośrednio w przeglądarce"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Zarządzanie warstwami"
                  secondary="Dodawaj, usuwaj i stylizuj warstwy danych"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Narzędzia pomiarowe"
                  secondary="Mierz odległości, powierzchnie i obwody"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Współpraca zespołowa"
                  secondary="Udostępniaj projekty i pracuj zespołowo"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Eksport danych"
                  secondary="Eksportuj dane w różnych formatach GIS"
                />
              </ListItem>
            </List>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}