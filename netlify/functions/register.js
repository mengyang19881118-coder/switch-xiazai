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
  if (user.length < 2 || user.length > 20) return { statusCode: 400, headers, body: JSON.stringify({ error: '用户名需要2-20个字符' }) };
  if (pass.length < 6) return { statusCode: 400, headers, body: JSON.stringify({ error: '密码至少6位' }) };
  if (!/^[a-zA-Z0-9\u4e00-\u9fff_]+$/.test(user)) return { statusCode: 400, headers, body: JSON.stringify({ error: '用户名只允许中文、英文、数字、下划线' }) };

  const BAD_NAMES = ['admin','test','root','null','undefined','administrator','superuser','fangke','fake','spam','bot','robot','恶意','广告','推广','switch','ns','xiazai'];
  if (BAD_NAMES.includes(user.toLowerCase())) return { statusCode: 400, headers, body: JSON.stringify({ error: '该用户名不可用，请更换' }) };
  if (/^\d+$/.test(user)) return { statusCode: 400, headers, body: JSON.stringify({ error: '用户名不能全是数字' }) };

  try {
    const store = getStore('ns-users', { siteID: SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });
    const existingRaw = await store.get(user);
    if (existingRaw) return { statusCode: 409, headers, body: JSON.stringify({ error: '用户名已存在' }) };

    const newUser = {
      id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: user,
      pass: pass,
      points: 20,
      role: 'vip',
      vipExpire: null,
      totalDownloads: 0,
      lastCheckin: null,
      createdAt: new Date().toISOString(),
    };

    await store.set(user, JSON.stringify(newUser));

    const { pass: _, ...safeUser } = newUser;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, user: safeUser }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误：' + err.message }) };
  }
};
