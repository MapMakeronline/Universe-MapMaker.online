/**
 * KLIENT API - UNIWERSALNA BIBLIOTEKA KOMUNIKACJI Z BACKENDEM
 * 
 * Odpowiada za:
 * - Klasę ApiClient do wykonywania żądań HTTP
 * - Obsługę metod REST (GET, POST, PUT, DELETE)
 * - Automatyczne parsowanie JSON response
 * - Zarządzanie nagłówkami HTTP (Content-Type, Authorization)
 * - Obsługę błędów HTTP i network errors
 * - Konfigurację base URL i timeoutów
 * - Interceptory dla request/response
 */

// ===================================================================
// KONFIGURACJA API - URL bazowy i ustawienia
// ===================================================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// ===================================================================
// INTERFACE OPCJI ŻĄDANIA - Rozszerza standardowy RequestInit
// ===================================================================
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>; // Opcjonalne parametry URL query
}

// ===================================================================
// KLASA API CLIENT - Główna klasa do komunikacji z API
// ===================================================================
/**
 * Uniwersalny klient API do wykonywania żądań HTTP
 * Automatycznie dodaje nagłówki, obsługuje błędy i parsuje JSON
 */
class ApiClient {
  private baseURL: string; // Bazowy URL API

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // ===================================================================
  // PRYWATNA METODA REQUEST - Uniwersalna funkcja do żądań HTTP
  // ===================================================================
  private async request<T>(
    endpoint: string,     // Endpoint API (np. '/layers')
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    // Budowanie URL z bazowym adresem
    let url = `${this.baseURL}${endpoint}`;
    
    // Dodawanie parametrów query do URL
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    // Konfiguracja żądania fetch
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json', // Domyślny content type
        ...fetchOptions.headers,            // Dodatkowe nagłówki
      },
      ...fetchOptions, // Pozostałe opcje fetch
    };

    try {
      // Wykonanie żądania HTTP
      const response = await fetch(url, config);
      
      // Sprawdzenie czy żądanie się powiodło
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parsowanie odpowiedzi JSON
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error; // Przekazanie błędu do obsługi przez hook
    }
  }

  // ===================================================================
  // PUBLICZNE METODY HTTP - Wygodne funkcje do różnych typów żądań
  // ===================================================================
  
  /**
   * GET - Pobieranie danych z serwera
   * @param endpoint - Endpoint API
   * @param params - Opcjonalne parametry query
   */
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST - Wysyłanie nowych danych na serwer
   * @param endpoint - Endpoint API
   * @param data - Dane do wysłania w body
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data), // Serializacja danych do JSON
    });
  }

  /**
   * PUT - Aktualizacja istniejących danych
   * @param endpoint - Endpoint API
   * @param data - Dane do aktualizacji
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE - Usuwanie danych z serwera
   * @param endpoint - Endpoint API
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ===================================================================
// EKSPORT INSTANCJI - Gotowy do użycia klient API
// ===================================================================
export const apiClient = new ApiClient();