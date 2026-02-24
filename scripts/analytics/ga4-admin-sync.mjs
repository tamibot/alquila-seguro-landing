import 'dotenv/config';
import { google } from 'googleapis';

const APPLY = process.argv.includes('--apply');
const DRY = process.argv.includes('--dry-run') || !APPLY;

const propertyId = process.env.GA4_PROPERTY_ID;
if (!propertyId) {
  console.error('Missing GA4_PROPERTY_ID in environment.');
  process.exit(1);
}

const customDimensions = [
  { displayName: 'CTA Text', parameterName: 'cta_text', description: 'Texto del CTA clickeado', scope: 'EVENT' },
  { displayName: 'CTA Href', parameterName: 'cta_href', description: 'URL del CTA clickeado', scope: 'EVENT' },
  { displayName: 'CTA Section', parameterName: 'cta_section', description: 'Seccion de la landing donde ocurre el click', scope: 'EVENT' },
  { displayName: 'CTA Type', parameterName: 'cta_type', description: 'Tipo de CTA (whatsapp/navigation)', scope: 'EVENT' },
  { displayName: 'Video Id', parameterName: 'video_id', description: 'ID de video abierto', scope: 'EVENT' },
  { displayName: 'Video Context', parameterName: 'video_context', description: 'Contexto del video abierto', scope: 'EVENT' }
];

const conversionEvents = ['cta_click'];

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/analytics.edit'] });
  const analyticsadmin = google.analyticsadmin({ version: 'v1beta', auth });
  const parent = `properties/${propertyId}`;

  const existingDimensionsResp = await analyticsadmin.properties.customDimensions.list({ parent });
  const existingDimensions = new Map((existingDimensionsResp.data.customDimensions || []).map((d) => [d.parameterName, d]));

  for (const dimension of customDimensions) {
    if (existingDimensions.has(dimension.parameterName)) {
      console.log(`= custom dimension exists: ${dimension.parameterName}`);
      continue;
    }

    if (DRY) {
      console.log(`[dry-run] + create custom dimension: ${dimension.parameterName}`);
      continue;
    }

    await analyticsadmin.properties.customDimensions.create({ parent, requestBody: dimension });
    console.log(`+ custom dimension created: ${dimension.parameterName}`);
  }

  const existingConversionsResp = await analyticsadmin.properties.conversionEvents.list({ parent });
  const existingConversions = new Set((existingConversionsResp.data.conversionEvents || []).map((e) => e.eventName));

  for (const eventName of conversionEvents) {
    if (existingConversions.has(eventName)) {
      console.log(`= conversion exists: ${eventName}`);
      continue;
    }

    if (DRY) {
      console.log(`[dry-run] + create conversion event: ${eventName}`);
      continue;
    }

    await analyticsadmin.properties.conversionEvents.create({ parent, requestBody: { eventName } });
    console.log(`+ conversion event created: ${eventName}`);
  }

  console.log(DRY ? '\nDry run finished.' : '\nApply finished.');
}

main().catch((err) => {
  console.error('GA4 sync failed:', err?.message || err);
  process.exit(1);
});
