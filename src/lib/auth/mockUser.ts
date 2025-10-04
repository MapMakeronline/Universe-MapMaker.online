/**
 * Mock user data - replace with actual user state from Redux/Auth
 * This file provides a centralized mock user for development.
 *
 * TODO: Replace with actual authentication state from Redux store
 */

export interface MockUser {
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export const currentUser: MockUser = {
  name: "Jan Kowalski",
  email: "jan.kowalski@example.com",
  isLoggedIn: false, // Change to true to test logged-in state
};
