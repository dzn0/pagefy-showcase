// Tipos mínimos do Google Identity Services (GIS) para o fluxo de token OAuth
// em pop-up. A lib carrega via <script> (ver AuthProvider), não via npm —
// por isso os tipos são escritos à mão em vez de vir de um pacote @types.
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient;
        };
      };
    };
  }
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: GoogleTokenError) => void;
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
}

interface GoogleTokenError {
  type: string;
  message?: string;
}

interface GoogleTokenClient {
  requestAccessToken(overrides?: { prompt?: "" | "none" | "consent" | "select_account" }): void;
}
