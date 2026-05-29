const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: '只支持 DELETE 请求' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '无效的请求数据' }) };
  }

  const { username } = body;
  if (!username) return { statusCode: 400, headers, body: JSON.stringify({ error: '缺少用户名' }) };

  try {
    const store = getStore('ns-users');
    const userDataRaw = await store.get(username);
    if (!userDataRaw) return { statusCode: 404, headers, body: JSON.stringify({ error: '用户不存在' }) };

    await store.delete(username);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误：' + err.message }) };
  }
};
