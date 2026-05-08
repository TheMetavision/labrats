import { createClient } from '@sanity/client';

export const liveClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'o9qrmykx',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: import.meta.env.SANITY_API_TOKEN,
});