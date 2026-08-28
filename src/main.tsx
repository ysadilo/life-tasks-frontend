import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './theme/ThemeProvider';
import { Auth0ProviderWithNavigate } from './auth/Auth0ProviderWithNavigate';
import { Auth0TokenBridge } from './auth/Auth0TokenBridge';
import App from './App';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Auth0ProviderWithNavigate>
            <Auth0TokenBridge />
            <App />
          </Auth0ProviderWithNavigate>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
