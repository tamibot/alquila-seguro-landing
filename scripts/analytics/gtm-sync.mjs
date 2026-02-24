import 'dotenv/config';
import { google } from 'googleapis';

const APPLY = process.argv.includes('--apply');
const DRY = process.argv.includes('--dry-run') || !APPLY;

const accountId = process.env.GTM_ACCOUNT_ID;
const containerId = process.env.GTM_CONTAINER_ID;
const workspaceId = process.env.GTM_WORKSPACE_ID;
const measurementId = process.env.GA4_MEASUREMENT_ID;

if (!accountId || !containerId || !workspaceId || !measurementId) {
  console.error('Missing GTM_ACCOUNT_ID, GTM_CONTAINER_ID, GTM_WORKSPACE_ID or GA4_MEASUREMENT_ID in environment.');
  process.exit(1);
}

const root = `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`;

const dlVariables = [
  { name: 'DLV - cta_text', key: 'cta_text' },
  { name: 'DLV - cta_href', key: 'cta_href' },
  { name: 'DLV - cta_section', key: 'cta_section' },
  { name: 'DLV - cta_type', key: 'cta_type' },
  { name: 'DLV - video_id', key: 'video_id' },
  { name: 'DLV - video_context', key: 'video_context' }
];

function dataLayerVariableBody(name, key) {
  return {
    name,
    type: 'v',
    parameter: [
      { type: 'template', key: 'name', value: key },
      { type: 'integer', key: 'dataLayerVersion', value: '2' }
    ]
  };
}

function customEventTriggerBody(name, eventName) {
  return {
    name,
    type: 'customEvent',
    customEventFilter: [
      {
        type: 'equals',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: eventName }
        ]
      }
    ]
  };
}

function ga4ConfigTagBody(allPagesTriggerId) {
  return {
    name: 'GA4 - Config',
    type: 'gaawc',
    parameter: [
      { type: 'template', key: 'measurementId', value: measurementId }
    ],
    firingTriggerId: [allPagesTriggerId]
  };
}

function ga4EventTagBody(name, eventName, triggerId, extraParams = []) {
  const eventParameters = extraParams.map((item) => ({
    type: 'map',
    map: [
      { type: 'template', key: 'name', value: item.name },
      { type: 'template', key: 'value', value: item.value }
    ]
  }));

  return {
    name,
    type: 'gaawe',
    parameter: [
      { type: 'template', key: 'measurementId', value: measurementId },
      { type: 'template', key: 'eventName', value: eventName },
      { type: 'list', key: 'eventParameters', list: eventParameters }
    ],
    firingTriggerId: [triggerId]
  };
}

async function upsertByName(listFn, createFn, updateFn, body, kind) {
  const found = await listFn();
  const item = found.find((x) => x.name === body.name);

  if (!item) {
    if (DRY) {
      console.log(`[dry-run] + create ${kind}: ${body.name}`);
      return null;
    }

    const created = await createFn(body);
    console.log(`+ created ${kind}: ${body.name}`);
    return created;
  }

  if (DRY) {
    console.log(`[dry-run] ~ update ${kind}: ${body.name}`);
    return item;
  }

  const updated = await updateFn(item, body);
  console.log(`~ updated ${kind}: ${body.name}`);
  return updated;
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/tagmanager.edit.containers']
  });

  const tagmanager = google.tagmanager({ version: 'v2', auth });

  const listVariables = async () => (await tagmanager.accounts.containers.workspaces.variables.list({ parent: root })).data.variable || [];
  const listTriggers = async () => (await tagmanager.accounts.containers.workspaces.triggers.list({ parent: root })).data.trigger || [];
  const listTags = async () => (await tagmanager.accounts.containers.workspaces.tags.list({ parent: root })).data.tag || [];

  const createVariable = async (body) => (await tagmanager.accounts.containers.workspaces.variables.create({ parent: root, requestBody: body })).data;
  const updateVariable = async (existing, body) => (await tagmanager.accounts.containers.workspaces.variables.update({ path: existing.path, requestBody: { ...existing, ...body } })).data;

  const createTrigger = async (body) => (await tagmanager.accounts.containers.workspaces.triggers.create({ parent: root, requestBody: body })).data;
  const updateTrigger = async (existing, body) => (await tagmanager.accounts.containers.workspaces.triggers.update({ path: existing.path, requestBody: { ...existing, ...body } })).data;

  const createTag = async (body) => (await tagmanager.accounts.containers.workspaces.tags.create({ parent: root, requestBody: body })).data;
  const updateTag = async (existing, body) => (await tagmanager.accounts.containers.workspaces.tags.update({ path: existing.path, requestBody: { ...existing, ...body } })).data;

  for (const variable of dlVariables) {
    await upsertByName(
      listVariables,
      createVariable,
      updateVariable,
      dataLayerVariableBody(variable.name, variable.key),
      'variable'
    );
  }

  const triggersNow = await listTriggers();
  let allPages = triggersNow.find((t) => t.name === 'All Pages');

  if (!allPages) {
    allPages = await upsertByName(
      listTriggers,
      createTrigger,
      updateTrigger,
      { name: 'All Pages', type: 'PAGEVIEW' },
      'trigger'
    );
  }

  const ctaTrigger = await upsertByName(
    listTriggers,
    createTrigger,
    updateTrigger,
    customEventTriggerBody('EV - cta_click', 'cta_click'),
    'trigger'
  );

  const videoTrigger = await upsertByName(
    listTriggers,
    createTrigger,
    updateTrigger,
    customEventTriggerBody('EV - video_open', 'video_open'),
    'trigger'
  );

  const tagsNow = await listTags();
  let ga4Config = tagsNow.find((t) => t.name === 'GA4 - Config');
  if (!ga4Config) {
    ga4Config = await upsertByName(
      listTags,
      createTag,
      updateTag,
      ga4ConfigTagBody(allPages?.triggerId || '2147479553'),
      'tag'
    );
  }

  await upsertByName(
    listTags,
    createTag,
    updateTag,
    ga4EventTagBody('GA4 - Event - cta_click', 'cta_click', ctaTrigger?.triggerId || '' , [
      { name: 'cta_text', value: '{{DLV - cta_text}}' },
      { name: 'cta_href', value: '{{DLV - cta_href}}' },
      { name: 'cta_section', value: '{{DLV - cta_section}}' },
      { name: 'cta_type', value: '{{DLV - cta_type}}' }
    ]),
    'tag'
  );

  await upsertByName(
    listTags,
    createTag,
    updateTag,
    ga4EventTagBody('GA4 - Event - video_open', 'video_open', videoTrigger?.triggerId || '', [
      { name: 'video_id', value: '{{DLV - video_id}}' },
      { name: 'video_context', value: '{{DLV - video_context}}' }
    ]),
    'tag'
  );

  console.log(DRY ? '\nDry run finished. Review GTM workspace changes.' : '\nApply finished. Publish workspace from GTM UI.');
}

main().catch((err) => {
  console.error('GTM sync failed:', err?.message || err);
  process.exit(1);
});
