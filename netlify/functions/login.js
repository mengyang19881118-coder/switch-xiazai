const { getStore } = require('@netlify/blobs');
const SITE_ID = 'd2164136-15a1-4c7f-8b87-68fbf1790d17';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: '只支持 POST 请求' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '无效的请求数据' }) };
  }

  const { user, pass } = body;
  if (!user || !pass) return { statusCode: 400, headers, body: JSON.stringify({ error: '用户名和密码不能为空' }) };

  try {
    const store = getStore('ns-users', { siteID: SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });
    const userDataRaw = await store.get(user);
    if (!userDataRaw) return { statusCode: 401, headers, body: JSON.stringify({ error: '用户不存在' }) };

    const userData = JSON.parse(userDataRaw);
    if (userData.pass !== pass) return { statusCode: 401, headers, body: JSON.stringify({ error: '密码错误' }) };

    const { pass: _, ...safeUser } = userData;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, user: safeUser }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误：' + err.message }) };
  }
};
