const { getStore } = require('@netlify/blobs');
const SITE_ID = 'd2164136-15a1-4c7f-8b87-68fbf1790d17';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: '只支持 GET 请求' }) };
  }

  try {
    const store = getStore('ns-users', { siteID: SITE_ID, token: 'nfp_rDcVTKeEg595oD3ovWu7H58j47JQ7yXUaddd' });
    const { blobs } = await store.list();
    const users = {};
    for (const blob of blobs) {
      const raw = await store.get(blob.key);
      if (raw) {
        try {
          const u = JSON.parse(raw);
          const { pass, ...safe } = u;
          users[u.name] = safe;
        } catch {}
      }
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, users }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误：' + err.message }) };
  }
};
