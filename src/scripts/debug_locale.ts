import { moduleRegistry } from '../core/moduleRegistry';
import { getDictionary, getLocaleFromCookies } from '../shared/i18n/server';

// Simulate Next.js context since getLocaleFromCookies relies on headers()
// Actually, getLocaleFromCookies() inside a CLI script will crash because Next.js headers() 
// are only available during a request. Let's just create a mock route or log inside page.tsx instead.
