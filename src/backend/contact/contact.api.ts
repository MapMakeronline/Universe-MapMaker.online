/**
 * Contact Module - RTK Query API
 *
 * Endpoints:
 * - sendContactMessage: Submit contact form (public, no auth required)
 */

import { baseApi } from '../client/base-api';
import type { ContactFormData, ApiResponse } from '../types';

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /dashboard/contact/
     * Send contact form message
     *
     * NOTE: Documentation says "no auth required", but backend returns 401 without token.
     * This suggests the endpoint DOES require authentication.
     *
     * Backend response: { message: "Wiadomość została wysłana pomyślnie" }
     * - Saves message to database
     * - Sends email to admins
     * - Sends confirmation email to sender
     */
    sendContactMessage: builder.mutation<ApiResponse<null>, ContactFormData>({
      query: (data) => ({
        url: '/dashboard/contact/',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useSendContactMessageMutation,
} = contactApi;
