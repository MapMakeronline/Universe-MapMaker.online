# Instrukcja Zarządzania Treścią (CMS)

## 📚 Spis Treści
1. [Dostęp do CMS](#dostęp-do-cms)
2. [Edycja Bloga](#edycja-bloga)
3. [Edycja FAQ](#edycja-faq)
4. [Edycja Regulaminu](#edycja-regulaminu)
5. [Zapisywanie zmian](#zapisywanie-zmian)
6. [Integracja z backendem](#integracja-z-backendem)

---

## 🔐 Dostęp do CMS

### Wymagania:
- **Musisz być zalogowany jako administrator**
- Konto admina rozpoznawane jest po:
  - Email zawiera `@universemapmaker.online` LUB
  - Username = `admin`

### Jak wejść do CMS:
1. Zaloguj się na konto administratora
2. Przejdź do Dashboard
3. W lewym menu znajdź sekcję **"ADMINISTRACJA"**
4. Kliknij **"Zarządzanie Treścią"** (ikona edycji 📝)

---

## 📝 Edycja Bloga

### Funkcje:
- ✅ Dodawanie nowych artykułów
- ✅ Edycja istniejących artykułów
- ✅ Usuwanie artykułów
- ✅ Automatyczne generowanie URL slug
- ✅ Kategorie: Tutorial, Aktualności, Poradnik, Case Study, Technologia

### Jak dodać nowy artykuł:

1. **Kliknij "Nowy Artykuł"**
2. **Wypełnij formularz:**
   - **Tytuł** - np. "Jak stworzyć pierwszą mapę"
   - **URL Slug** - generuje się automatycznie (np. `jak-stworzyc-pierwsza-mape`)
   - **Krótki opis (excerpt)** - 1-2 zdania dla listy artykułów
   - **Treść artykułu** - pełna treść w formacie Markdown
   - **Autor** - imię i nazwisko autora
   - **Data publikacji** - wybierz z kalendarza
   - **Kategoria** - wybierz z listy

3. **Kliknij "Zapisz"**

### Format Markdown dla treści:

```markdown
# Główny nagłówek (H1)

## Podtytuł (H2)

### Sekcja (H3)

**Pogrubiony tekst**

*Kursywa*

- Punkt listy 1
- Punkt listy 2

1. Numerowana lista
2. Kolejny punkt

```kod```
Blok kodu
```

[Link](https://example.com)
```

### Jak edytować artykuł:
1. Znajdź artykuł na liście
2. Kliknij ikonę **edycji** (ołówek)
3. Zmień potrzebne pola
4. Kliknij "Zapisz"

### Jak usunąć artykuł:
1. Kliknij ikonę **kosza** przy artykule
2. Potwierdź usunięcie

---

## ❓ Edycja FAQ

### Funkcje:
- ✅ Dodawanie pytań i odpowiedzi
- ✅ Edycja istniejących pytań
- ✅ Usuwanie pytań
- ✅ Grupowanie po kategoriach
- ✅ 6 kategorii: Podstawy, Projekty, Warstwy i Mapy, Narzędzia, Problemy techniczne, Bezpieczeństwo

### Jak dodać nowe pytanie:

1. **Kliknij "Dodaj Pytanie"**
2. **Wypełnij formularz:**
   - **Pytanie** - np. "Czym jest Universe MapMaker?"
   - **Odpowiedź** - szczegółowa odpowiedź (może być długa)
   - **Kategoria** - wybierz odpowiednią kategorię

3. **Kliknij "Zapisz"**

### Organizacja pytań:
- Pytania są automatycznie grupowane po kategoriach
- Każda kategoria jest rozwijana/zwijana (accordion)
- Licznik pokazuje ilość pytań w kategorii

### Jak edytować pytanie:
1. Rozwiń odpowiednią kategorię
2. Kliknij ikonę **edycji** przy pytaniu
3. Zmień tekst pytania lub odpowiedzi
4. Kliknij "Zapisz"

### Jak usunąć pytanie:
1. Kliknij ikonę **kosza**
2. Potwierdź usunięcie

---

## 📄 Edycja Regulaminu

### Funkcje:
- ✅ Edycja sekcji regulaminu
- ✅ Dodawanie nowych sekcji
- ✅ Usuwanie sekcji
- ✅ Tryb podglądu (Preview)
- ✅ Metadane: data aktualizacji, email kontaktowy

### Struktura regulaminu:
```
Regulamin Universe MapMaker
├── Metadata (data, email)
├── Sekcja 1: Postanowienia ogólne
├── Sekcja 2: Definicje
├── Sekcja 3: Rejestracja...
└── Kontakt (automatyczny)
```

### Jak edytować sekcję:

1. **Znajdź sekcję w trybie edycji**
2. **Zmień:**
   - **Tytuł sekcji** - np. "Postanowienia ogólne"
   - **Treść sekcji** - pełna treść (formatowanie zachowane)
3. **Kliknij "Zapisz Regulamin"**

### Jak dodać nową sekcję:
1. Scroll na dół listy sekcji
2. Kliknij **"+ Dodaj Nową Sekcję"**
3. Wypełnij tytuł i treść
4. Zapisz

### Jak usunąć sekcję:
1. Kliknij **"Usuń"** przy sekcji
2. Potwierdź usunięcie
3. ⚠️ Nie można usunąć ostatniej sekcji

### Tryb Podglądu:
1. Kliknij **"Podgląd"** (ikona oka)
2. Zobacz jak wygląda regulamin dla użytkowników
3. Kliknij **"Tryb Edycji"** aby wrócić do edycji

### Metadane:
- **Data aktualizacji** - automatycznie wyświetlana u góry regulaminu
- **Email kontaktowy** - wyświetlany w sekcji kontakt

---

## 💾 Zapisywanie zmian

### ⚠️ OBECNY STAN (Wersja lokalna):

**Zmiany są zapisywane TYLKO w pamięci przeglądarki!**

To oznacza:
- ❌ Po odświeżeniu strony zmiany znikają
- ❌ Inne administratorzy nie widzą zmian
- ❌ Dane nie są zapisywane w bazie danych

**To jest wersja prototypowa do testów!**

### ✅ PRZYSZŁA IMPLEMENTACJA (Produkcja):

Docelowo system będzie zapisywał dane na 2 sposoby:

#### **Opcja 1: Pliki JSON (prostsze)**
```
/public/data/
  ├── blog.json       # Artykuły bloga
  ├── faq.json        # Pytania FAQ
  └── regulamin.json  # Sekcje regulaminu
```

**Jak będzie działać:**
1. Admin edytuje treść w CMS
2. Kliknięcie "Zapisz" → API zapisuje do pliku JSON
3. Strony publiczne (`/blog`, `/faq`, `/regulamin`) czytają z JSON
4. Zmiany widoczne od razu dla wszystkich

**Endpoint do implementacji:**
```typescript
// Backend (Django)
POST /api/cms/blog/save
POST /api/cms/faq/save
POST /api/cms/regulamin/save

// Request body przykład:
{
  "posts": [
    {
      "id": 1,
      "title": "...",
      "content": "...",
      // ...
    }
  ]
}
```

#### **Opcja 2: Baza danych PostgreSQL (zalecana dla produkcji)**

**Tabele do utworzenia:**

```sql
-- Blog posts
CREATE TABLE cms_blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author VARCHAR(100),
  category VARCHAR(50),
  published_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FAQ items
CREATE TABLE cms_faq_items (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Regulamin sections
CREATE TABLE cms_regulamin_sections (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Regulamin metadata
CREATE TABLE cms_regulamin_meta (
  id SERIAL PRIMARY KEY,
  last_update DATE,
  contact_email VARCHAR(100)
);
```

**Endpoints do implementacji:**

```python
# Django views.py

@api_view(['GET', 'POST'])
def blog_posts(request):
    if request.method == 'GET':
        posts = BlogPost.objects.all()
        return Response(BlogPostSerializer(posts, many=True).data)

    elif request.method == 'POST':
        # Tylko admin
        if not request.user.is_staff:
            return Response({'error': 'Unauthorized'}, status=403)

        serializer = BlogPostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# Podobnie dla FAQ i Regulamin
```

**Frontend - integracja z API:**

```typescript
// src/api/cms.ts

export const cmsApi = {
  // Blog
  async getBlogPosts() {
    return apiClient.get<BlogPost[]>('/cms/blog/posts');
  },

  async saveBlogPost(post: BlogPost) {
    return apiClient.post('/cms/blog/posts', post);
  },

  async deleteBlogPost(id: number) {
    return apiClient.delete(`/cms/blog/posts/${id}`);
  },

  // FAQ
  async getFAQItems() {
    return apiClient.get<FAQItem[]>('/cms/faq/items');
  },

  async saveFAQItem(item: FAQItem) {
    return apiClient.post('/cms/faq/items', item);
  },

  // Regulamin
  async getRegulaminSections() {
    return apiClient.get<RegulaminSection[]>('/cms/regulamin/sections');
  },

  async saveRegulaminSections(sections: RegulaminSection[]) {
    return apiClient.post('/cms/regulamin/sections', sections);
  },
};
```

**Zaktualizowane komponenty CMS:**

```typescript
// BlogEditor.tsx - przykład integracji
import { cmsApi } from '@/api/cms';

const handleSave = async () => {
  try {
    if (editingPost) {
      await cmsApi.saveBlogPost(formData as BlogPost);
    } else {
      await cmsApi.saveBlogPost(formData as BlogPost);
    }

    // Odśwież listę z backendu
    const posts = await cmsApi.getBlogPosts();
    setPosts(posts);

    alert('Zapisano pomyślnie!');
  } catch (error) {
    alert('Błąd zapisu: ' + error.message);
  }
};
```

---

## 🔧 Integracja z backendem

### Kroki implementacji produkcyjnej:

#### **Krok 1: Backend (Django)**

1. **Utwórz nową aplikację Django:**
```bash
cd Universe-Mapmaker-Backend
python manage.py startapp cms
```

2. **Dodaj modele** (`cms/models.py`):
```python
from django.db import models

class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    excerpt = models.TextField()
    content = models.TextField()
    author = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    published_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class FAQItem(models.Model):
    question = models.TextField()
    answer = models.TextField()
    category = models.CharField(max_length=50)
    order_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class RegulaminSection(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    order_index = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
```

3. **Utwórz API endpoints** (`cms/views.py`, `cms/urls.py`)

4. **Dodaj do settings.py:**
```python
INSTALLED_APPS = [
    # ...
    'cms',
]
```

5. **Migracje:**
```bash
python manage.py makemigrations
python manage.py migrate
```

#### **Krok 2: Frontend (Next.js)**

1. **Utwórz API client** (`src/api/cms.ts`)
2. **Zaktualizuj komponenty CMS** aby używały prawdziwego API
3. **Dodaj loading states i error handling**

#### **Krok 3: Strony publiczne**

1. **Zaktualizuj `/blog/page.tsx`** - pobieraj dane z API zamiast z konstant
2. **Zaktualizuj `/faq/page.tsx`** - pobieraj FAQ z API
3. **Zaktualizuj `/regulamin/page.tsx`** - pobieraj sekcje z API

#### **Krok 4: SSR/ISR dla SEO**

```typescript
// app/blog/page.tsx
export const revalidate = 3600; // ISR - odśwież co godzinę

export default async function BlogPage() {
  const posts = await cmsApi.getBlogPosts(); // Server-side fetch

  return (
    // Render posts...
  );
}
```

---

## 🚀 Roadmapa CMS

### ✅ Zrobione (v1.0 - Prototyp):
- Panel CMS w dashboardzie admina
- Edytor blogów (CRUD)
- Edytor FAQ (CRUD)
- Edytor regulaminu (CRUD)
- Tryb podglądu dla regulaminu
- Automatyczne generowanie slug dla blogów

### 🔄 Do zrobienia (v2.0 - Produkcja):
- [ ] Integracja z PostgreSQL
- [ ] API endpoints w Django
- [ ] Uploading obrazków dla blogów
- [ ] WYSIWYG editor (np. TinyMCE)
- [ ] Wersjonowanie treści (historia zmian)
- [ ] Multi-język (i18n)
- [ ] SEO metadata (title, description, og:image)
- [ ] Harmonogram publikacji (scheduled posts)
- [ ] Draft/Published status
- [ ] Autoryzacja per-sekcja (różne role adminów)

### 🎯 Przyszłość (v3.0):
- [ ] Media Library (zarządzanie obrazkami)
- [ ] Analytics dla artykułów (views, clicks)
- [ ] Comments system
- [ ] Newsletter integration
- [ ] A/B testing dla treści

---

## 📞 Pomoc techniczna

Jeśli potrzebujesz pomocy z CMS:
1. Sprawdź dokumentację backendu w `Universe-Mapmaker-Backend/README.md`
2. Sprawdź logi w konsoli przeglądarki (F12)
3. Skontaktuj się z zespołem deweloperskim

---

**Ostatnia aktualizacja:** 2025-10-10
**Wersja CMS:** 1.0 (Prototyp)
