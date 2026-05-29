const { getStore } = require('@netlify/blobs');

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
    const store = getStore('ns-users');
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
