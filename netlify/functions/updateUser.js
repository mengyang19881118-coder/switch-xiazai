const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: '只支持 PUT 请求' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '无效的请求数据' }) };
  }

  const { username, updates } = body;
  if (!username || !updates) return { statusCode: 400, headers, body: JSON.stringify({ error: '参数不完整' }) };

  try {
    const store = getStore('ns-users');
    const userDataRaw = await store.get(username);
    if (!userDataRaw) return { statusCode: 404, headers, body: JSON.stringify({ error: '用户不存在' }) };

    const userData = JSON.parse(userDataRaw);
    // 不允许通过此接口修改密码
    delete updates.pass;
    Object.assign(userData, updates);
    await store.set(username, JSON.stringify(userData));

    const { pass, ...safeUser } = userData;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, user: safeUser }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: '服务器错误：' + err.message }) };
  }
};
