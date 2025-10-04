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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ContactMail,
  Info,
  Business,
  Email,
  Phone,
  LocationOn,
  Send,
  VideoCall,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        <Typography variant="h4" component="h1" fontWeight="700" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Kontakt
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            allowScrollButtonsMobile
          >
            <Tab
              icon={isMobile ? undefined : <ContactMail />}
              label="Kontakt"
              iconPosition="start"
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 2, sm: 3 }
              }}
            />
            <Tab
              icon={isMobile ? undefined : <Info />}
              label="Informacje"
              iconPosition="start"
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 2, sm: 3 }
              }}
            />
            <Tab
              icon={isMobile ? undefined : <Business />}
              label="O MapMaker"
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

        {/* Contact Form Tab */}
        <TabPanel value={currentTab} index={0}>
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
            {/* Google Meet CTA Section */}
            <Box
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderRadius: 2,
                p: { xs: 3, sm: 4 },
                mb: 4,
                boxShadow: '0 4px 12px rgba(247, 94, 76, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '200px',
                  height: '200px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  pointerEvents: 'none',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VideoCall sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" fontWeight="700" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  Umów się na darmowe wdrożenie!
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 3, opacity: 0.95, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Nowoczesne podejście do kontaktu - spotkajmy się online! Przeprowadzę dla Ciebie
                <strong> bezpłatne wdrożenie aplikacji</strong> i pokażę wszystkie jej możliwości.
              </Typography>

              <Button
                variant="contained"
                size="large"
                href="https://meet.google.com/wqb-kfga-msg"
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<VideoCall />}
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textTransform: 'none',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  '&:hover': {
                    bgcolor: 'white',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Dołącz do spotkania Google Meet
              </Button>

              <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.9 }}>
                Stały link do spotkania - możesz dołączyć w dowolnym momencie
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                lub użyj tradycyjnego formularza
              </Typography>
            </Divider>

            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
              Wyślij wiadomość
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
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

              <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                  size="large"
                  fullWidth={isMobile}
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
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
              Dane kontaktowe
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1rem' } }}>
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
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1rem' } }}>
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
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
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