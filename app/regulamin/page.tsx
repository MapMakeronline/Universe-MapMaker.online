'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import PublicFooter from '@/components/navigation/PublicFooter';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

export default function RegulaminPage() {
  const theme = useTheme();

  return (
    <>
      <PublicNavbar title="Regulamin" />

      <Box sx={{ pt: 10, pb: 8, bgcolor: 'grey.50', minHeight: '100vh' }}>
        <Container maxWidth="md">
          <Breadcrumbs items={[{ label: 'Regulamin' }]} />

          <Paper sx={{ p: { xs: 3, md: 5 }, mb: 4 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                Regulamin korzystania z platformy MapMaker.online
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Ostatnia aktualizacja: 15 marca 2024
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Wprowadzenie */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Niniejszy regulamin określa ogólne warunki korzystania z platformy mapmaker.online, umożliwiającej pracę z danymi przestrzennymi Użytkownikom, którzy złożyli zamówienie usługi udostępnianej w modelu SaaS przez Administratora. Regulamin określa podstawowe kwestie w zakresie świadczonych usług, dodatkowe elementy mogą zostać uzgodnione przez Strony w odrębnych umowach.
              </Typography>
            </Box>

            {/* Section 1 - Definicje */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 1. Definicje
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>1. Administrator</strong> – GARD – Pracownia Urbanistyczno-Architektoniczna – mgr inż. arch. Anna Woźnicka, z siedzibą przy ul. Traktorowa 43 lok. 2, 91-217 Łódź, adres do korespondencji: ul. Telefoniczna 46 F, 92-016 Łódź, NIP 9471067333, zwana zamiennie Usługodawcą lub GARD.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>2. Regulamin</strong> – niniejszy regulamin świadczenia usług przez Administratora.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>3. Usługobiorca</strong> – podmiot, który złoży zamówienie na usługę w platformie mapmaker.online.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>4. Użytkownik</strong> – podmiot korzystający z platformy mapmaker.online.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>5. Usługa</strong> – dostęp do Aplikacji pod nazwą MapMaker, udostępnianej Użytkownikowi na warunkach określonych przez niniejszy Regulamin.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>6. Okres abonamentu (okres trwania umowy)</strong> – po upływie darmowego okresu próbnego, jeśli Usługobiorca wyrazi wolę dalszego korzystania z Aplikacji i zwiąże się z Usługodawcą umową.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>7. Darmowy okres próbny</strong> – okres 14 dni liczony od dnia rejestracji Użytkownika w aplikacji.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>8. Konto użytkownika</strong> – indywidualny dostęp danego Użytkownika do Aplikacji, określany przez Login, Hasło, poziom uprawnień oraz termin ważności konta, tj. datę, po której dostęp do Aplikacji zostanie danemu Użytkownikowi zablokowany.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>9. Login</strong> – stworzone przez Usługobiorcę indywidualne i niepowtarzalne oznaczenie Użytkownika, mające formę adresu e-mail, wykorzystywane przy korzystaniu z Usługi.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>10. Hasło</strong> – stworzony przez Usługobiorcę ciąg znaków, używany do zabezpieczenia dostępu do korzystania z Usługi.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>11. Cennik</strong> – załącznik nr 1 do niniejszego Regulaminu, z którego treścią Użytkownik winien się zapoznać i zaakceptować jego zawartość przed podpisaniem umowy.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>12. Dane osobowe</strong> – są to wszelkie dane określone w Rozporządzeniu Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r., zwanym dalej ogólnym rozporządzeniem o ochronie danych lub RODO, dotyczące Usługobiorcy – w stosunku do danych osobowych, którego Usługodawca jest Administratorem.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>13. Prawa autorskie</strong> – prawa autorskie w rozumieniu ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych (Dz.U. 1994 nr 24 poz. 83).
              </Typography>
            </Box>

            {/* Section 2 - Informacje ogólne */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 2. Informacje ogólne
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Administrator stworzył platformę internetową mapmaker.online, do której przysługują mu wszelkie prawa, w tym w szczególności prawa autorskie. Administrator zamierza świadczyć Usługi w modelu SaaS na rzecz Użytkowników, którzy zawrą z nim Umowę, akceptując jednocześnie niniejszy regulamin. Regulamin określa zasady świadczenia przez Usługodawcę usługi polegającej na udostępnieniu Usługobiorcom – na okres abonamentu – oprogramowania komputerowego umożliwiającego pracę z danymi przestrzennymi przy wykorzystaniu przeglądarki internetowej oraz udzielaniu w tym okresie podstawowej pomocy technicznej dotyczącej korzystania z tego oprogramowania. Administrator ma dostęp do danych Usługobiorcy podanych podczas rejestracji. Administrator zobowiązuje się do zachowania tych danych w tajemnicy, nie ujawniając ich podmiotom nieuprawnionym.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Korzystanie z Oprogramowania warunkowane jest zaakceptowaniem przez Użytkownika warunków niniejszego Regulaminu oraz przestrzeganiem przez Użytkowników obowiązujących przepisów prawa oraz niniejszego Regulaminu. Niniejszy Regulamin jest regulaminem, o którym mowa w art. 8 ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną (Dz. U. z 2002 r. Nr 144, poz. 1204 z późn. zm.).
              </Typography>
            </Box>

            {/* Section 3 - Zasady korzystania z platformy */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 3. Zasady korzystania z platformy
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 3, mb: 1 }}>
                1. Zakres usług
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                W zakres Usług świadczonych na rzecz Usługobiorcy przez Administratora wchodzi uruchomienie Systemu w modelu SaaS (Software as a Service) na serwerze Administratora, udzielając Użytkownikom prawa do korzystania z oprogramowania po uiszczeniu opłaty abonamentowej, z zastrzeżeniem przepisów dotyczących okresu darmowego.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                W ramach modelu SaaS Administrator zapewnia:
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', lineHeight: 1.8, pl: 4, mb: 2 }}>
                <li>dostęp do funkcjonalności aplikacji</li>
                <li>aktualizacje do nowych wersji aplikacji</li>
                <li>zapewnienie bezpieczeństwa w zakresie incydentów naruszenia bezpieczeństwa przez nieuprawnionych użytkowników</li>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 3, mb: 1 }}>
                2. Uzyskanie dostępu do platformy
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Usługobiorca zyskuje dostęp do platformy w momencie założenia konta na okres 14 dni. Dalsze korzystanie z konta możliwe jest po podpisaniu Umowy z Usługodawcą lub przez samodzielne przedłużenie okresu abonamentu w panelu zarządzania kontem.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 3, mb: 1 }}>
                3. Poziom dostępności usługi (SLA) oraz planowane wyłączenie usługi
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Usługodawca gwarantuje poziom dostępności usługi – 99%.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                W powyższym poziomie nie zawierają się zdarzenia uniemożliwiające świadczenie usług, na które Usługodawca nie ma wpływu, to jest wystąpienie zdarzeń siły wyższej, nieprawidłowe parametry techniczne urządzenia Użytkownika, planowane wyłączenia usługi.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                W razie konieczności aktualizacji oprogramowania, Usługodawca zaplanuje wyłączenie możliwości jej świadczenia, o czym Użytkownik zostanie zawiadomiony odpowiednio wcześniej. Usługodawca dołoży starań, by planowane wyłączenia odbywały się wyłącznie w porze nocnej (pomiędzy 22.00 a 7.00).
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                W razie niedotrzymania poziomu dostępności usługi, określonego powyżej, Usługodawca udzieli rabatu Użytkownikowi w wysokości 1 % miesięcznej opłaty abonamentowej za każdy 1 % spadku dostępności Usługi. Kwota udzielonego rabatu zostanie zwrócona na konto bankowe Użytkownika w terminie 14 dni od udzielenia przez Administratora informacji o kwocie udzielonego rabatu.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 3, mb: 1 }}>
                4. Darmowy okres próbny
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                W ciągu 14 dni liczonych od dnia założenia konta w Aplikacji, Użytkownik uzyskuje nieodpłatny dostęp do Aplikacji, podczas którego może przetestować jej funkcjonalność.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Po upływnie okresu próbnego, korzystanie z Aplikacji jest płatne. Użytkownik po upływie okresu próbnego w celu kontynuacji korzystania z aplikacji, powinien przedłużyć Abonament w panelu zarządzania kontem lub podpisać umowę z Administratorem.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Każdy Użytkownik ma prawo do skorzystania z darmowego okresu próbnego tylko raz.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 3, mb: 1 }}>
                5. Okres trwania umowy
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Jeśli Użytkownik, po upływie darmowego okresu próbnego wynoszącego 14 dni, wyrazi wolę dalszego korzystania z aplikacji, zawiera z Usługodawcą umowę na czas określony (1 miesiąc lub 1 rok).
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 3, mb: 1 }}>
                6. Rozwiązanie umowy
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Rozwiązanie umowy odbywa się w momencie nie przedłużenia abonamentu przez Użytkownika.
              </Typography>
            </Box>

            {/* Section 4 - Przetwarzanie i bezpieczeństwo danych osobowych */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 4. Przetwarzanie i bezpieczeństwo danych osobowych
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Usługodawca jest Administratorem danych osobowych: GARD – PRACOWNIA URBANISTYCZNO-ARCHITEKTONICZNA – MGR INŻ. ARCH. ANNA WOŹNICKA, ul. Wólczańska 55/59, 90-608 Łódź.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Administrator zapewnia ochronę przekazywanych mu przez Użytkowników do przetwarzania danych osobowych. Przetwarzanie danych osobowych odbywa się zgodnie z przepisami obowiązującego na terytorium Rzeczypospolitej Polskiej prawa, a w szczególności w: ustawie z dnia 10 maja 2018 r. o ochronie danych osobowych (Dz.U. 2018 poz. 1000), oraz RODO.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Administrator zastrzega sobie prawo ujawnienia wybranych informacji dotyczących Użytkownika lub innej osoby fizycznej korzystającej z Serwisu właściwym organom bądź osobom trzecim, które zgłoszą żądanie udzielenia takich informacji, w oparciu o odpowiednią podstawę prawną tylko i wyłącznie, jeżeli jest to zgodne z przepisami obowiązującego na terytorium Rzeczypospolitej Polskiej prawa. Poza przypadkami wskazanymi powyżej informacje dotyczące Użytkownika lub osoby korzystającej z Serwisu nie zostaną ujawnione żadnej osobie trzeciej, bez zgody Użytkownika lub osoby korzystającej z Serwisu udzielonej zgodnie z przepisami obowiązującego prawa.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Administrator jest uprawniony do przetwarzania Danych Osobowych wyłącznie w celu świadczenia Usług opisanych niniejszym Regulaminem przez Administratora, w szczególności przechowywania Danych Osobowych, ich zwielokrotniania, udostępniania, modyfikowania, usuwania w Systemie, o ile wykonywanie tych czynności jest uzasadnione realizacją Umowy.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                W ramach realizacji Usługi przetwarzane są następujące dane osobowe Użytkowników:
              </Typography>
              <Box component="ol" sx={{ color: 'text.secondary', lineHeight: 1.8, pl: 4, mb: 2 }}>
                <li>imię i nazwisko lub nazwa firmy Użytkownika</li>
                <li>adres poczty elektronicznej Użytkownika</li>
              </Box>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Udostępnianie danych osobowych przez Użytkowników ma charakter dobrowolny, jednak jest konieczne do realizacji Usługi. Dane są udostępniane przez Użytkownika na etapie zakładania przez niego konta oraz na etapie dokonywania korekty lub aktualizacji danych.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Użytkownik ma obowiązek niezwłocznego powiadomienia Usługodawcę o zmianie udostępnionych przez siebie danych osobowych. W wypadku braku powiadomienia o zmianie danych osobowych w terminie 3 dni od daty zaistnienia ich zmiany, dotychczasowe dane Użytkownika uważa się za aktualne.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Administrator oświadcza, że znane mu są wszelkie obowiązki wynikające z regulacji dotyczących ochrony danych osobowych, które zobowiązany jest wykonywać podmiot przetwarzający dane osobowe na zlecenie administratora danych oraz, że posiada zasoby niezbędne do bezpiecznego i zgodnego z prawem przetwarzania Danych Osobowych. Administrator jest zobowiązany wdrożyć i stosować przy przetwarzaniu Danych Osobowych zabezpieczenia przetwarzania danych osobowych, w tym środki techniczne i organizacyjne, na poziomie odpowiadającym co najmniej wymogom prawa w tym zakresie.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Po zakończeniu korzystania przez Użytkownika z Usługi Usługodawca może przetwarzać dane osobowe Użytkownika w zakresie koniecznym do realizacji następujących celów:
              </Typography>
              <Box component="ol" sx={{ color: 'text.secondary', lineHeight: 1.8, pl: 4, mb: 2 }}>
                <li>rozliczenia usługi lub dochodzenia roszczeń z tego tytułu,</li>
                <li>stwierdzenia czy korzystanie przez Użytkownika z Usługi było zgodne z Regulaminem oraz przepisami prawa i wyjaśnienia okoliczności ewentualnego niedozwolonego korzystania z tej usługi</li>
              </Box>
            </Box>

            {/* Section 5 - Dane systemowe */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 5. Dane systemowe
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Administrator wykorzystuje pliki typu cookie w celu gromadzenia informacji związanych z korzystaniem z usługi przez Użytkownika lub inną osobę fizyczną. Pliki typu cookies umożliwiają:
              </Typography>
              <Box sx={{ color: 'text.secondary', lineHeight: 1.8, pl: 4, mb: 2 }}>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                  a) dostosowanie usługi do potrzeb Użytkowników oraz innych osób korzystających z usługi,
                </Typography>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                  b) tworzenie statystyk oglądalności podstron ww. Serwisu.
                </Typography>
              </Box>
            </Box>

            {/* Section 6 - Płatności */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 6. Płatności
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Korzystanie z Usług Usługodawcy jest odpłatne. Zasady płatności są określone poniżej.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Opłata z tytułu korzystania z Aplikacji jest pobierana w wysokości określonej w Cenniku Usługodawcy obowiązującym – odpowiednio – w dniu zawarcia umowy lub w dniu przedłużenia umowy. Cennik został zamieszczony na stronie internetowej w zakładce Cennik.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Uiszczenie opłaty obejmuje opłatę z tytułu korzystania z oprogramowania oraz opłatę za wsparcie techniczne Usługodawcy.
              </Typography>
            </Box>

            {/* Section 7 - Kopie bezpieczeństwa */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 7. Kopie bezpieczeństwa
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Kopie zapasowe danych tworzone są nie rzadziej niż co 48 godzin, archiwizowane w niezależnej Infrastrukturze Serwerowej i utrzymywane przez okres nie krótszy niż 7 dni od dnia utworzenia kopii zapasowej.
              </Typography>
            </Box>

            {/* Section 8 - Prawa autorskie */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 8. Prawa autorskie
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Usługodawca oświadcza, że przysługują mu wyłączne autorskie prawa majątkowe do udostępnianego Użytkownikom oprogramowania, za wyjątkiem tych jego elementów, które stanowią biblioteki pochodzące z tzw. otwartego oprogramowania (biblioteki open source). Biblioteki zostały załączone do Oprogramowania oraz są rozpowszechniane w ramach Oprogramowania zgodnie z warunkami licencji określającymi zasady ich eksploatacji.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Zgodnie z przepisami ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych, Usługodawca udziela Użytkownikom niewyłącznej licencji na korzystanie z oprogramowania Platformy.
              </Typography>
            </Box>

            {/* Section 9 - Reklamacje */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 9. Reklamacje
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Usługobiorcy przysługuje prawo składania reklamacji dotyczących jakości świadczenia Usług.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Reklamacje składane są drogą elektroniczną na następujący adres e-mailowy: <strong>biurogard@gmail.com</strong>
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Usługodawca rozpatruje reklamację Usługobiorcy w możliwie najkrótszym terminie, lecz nie dłuższym niż 14 dni. Odpowiedź na reklamację jest przesyłana Usługobiorcy drogą elektroniczną.
              </Typography>
            </Box>

            {/* Section 10 - Postanowienia końcowe */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                § 10. Postanowienia końcowe
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Niniejszy Regulamin jest dostępny na stronie internetowej mapmaker.online. Usługodawca zastrzega sobie prawo do zmiany Regulaminu w szczególności, gdy będzie to wymagane aktualizacją lub zmianami w świadczeniu Usługi lub przepisami prawa.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                W przypadku zmiany Regulaminu Usługobiorca będzie informowany o wprowadzonej zmianie niezwłocznie, nie później niż 7 dni przed wejściem jej w życie, poprzez udostępnienie zaktualizowanej wersji Regulaminu na stronie internetowej mapmaker.online w wersji umożliwiającej jej zapis na dysku oraz co najmniej poprzez jedną z trzech metod informowania o zmianach:
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', lineHeight: 1.8, pl: 4, mb: 2 }}>
                <li>wysłanie informacji pocztą elektroniczną na adres podany przy rejestracji,</li>
                <li>wiadomość wewnątrz Aplikacji,</li>
                <li>informację o konieczności akceptację nowej wersji Regulaminu na etapie przedłużenia ważności konta.</li>
              </Box>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Wszelkie zmiany w Regulaminie obowiązują od dnia opublikowania go na stronie internetowej mapmaker.online.
              </Typography>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Kontakt</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                W razie pytań prosimy o kontakt:
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.primary.main, mt: 1 }}>
                biurogard@gmail.com
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                GARD – Pracownia Urbanistyczno-Architektoniczna<br/>
                ul. Telefoniczna 46 F, 92-016 Łódź<br/>
                NIP: 9471067333
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>

      <PublicFooter />
    </>
  );
}
