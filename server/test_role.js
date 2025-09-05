const base = 'http://127.0.0.1:4000';
const fetch = global.fetch || require('node-fetch');

async function json(res) {
  try { return await res.json(); } catch(e){ return { text: await res.text() }; }
}

async function login(username, password){
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username, password }) });
  const body = await json(res);
  return { ok: res.ok, status: res.status, body };
}

async function getProducts(){
  const res = await fetch(`${base}/api/products`);
  const body = await json(res);
  return { ok: res.ok, status: res.status, body };
}

async function putProduct(id, token, payload){
  const res = await fetch(`${base}/api/products/${id}`, { method: 'PUT', headers: Object.assign({'Content-Type':'application/json'}, token?{ Authorization: `Bearer ${token}` }:{}), body: JSON.stringify(payload) });
  const body = await json(res);
  return { ok: res.ok, status: res.status, body };
}

(async ()=>{
  try{
    console.log('Fetching products...');
    const prodRes = await getProducts();
    if (!prodRes.ok) { console.error('Failed to fetch products', prodRes); process.exit(1); }
    const first = prodRes.body[0];
    if (!first) { console.error('No products found'); process.exit(1); }
    console.log('Product:', first.id, '-', first.title);

    console.log('\nLogging in as user...');
    const u = await login('user','userpass');
    console.log('User login:', u.status, JSON.stringify(u.body));
    const userToken = u.body && u.body.token;

    console.log('\nUser attempts to change title (should be blocked)');
    const userTry = await putProduct(first.id, userToken, { title: 'HACKED_BY_USER' });
    console.log('User PUT status:', userTry.status, 'body:', JSON.stringify(userTry.body));

    console.log('\nLogging in as admin...');
    const a = await login('admin','adminpass');
    console.log('Admin login:', a.status, JSON.stringify(a.body));
    const adminToken = a.body && a.body.token;

    console.log('\nAdmin attempts to change title (should succeed)');
    const adminTry = await putProduct(first.id, adminToken, { title: 'UPDATED_BY_ADMIN' });
    console.log('Admin PUT status:', adminTry.status, 'body:', JSON.stringify(adminTry.body));

    console.log('\nFetch product after updates');
    const after = await fetch(`${base}/api/products/${first.id}`);
    const afterBody = await json(after);
    console.log('Final product fetch status:', after.status, 'body:', JSON.stringify(afterBody));
  }catch(err){
    console.error('Test script error:', err);
    process.exit(2);
  }
})();
