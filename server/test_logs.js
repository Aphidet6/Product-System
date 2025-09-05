const fetch = require('node-fetch');
const base = 'http://127.0.0.1:4000';

async function login(u,p){
  const r = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ username: u, password: p }) })
  const b = await r.json()
  return b.token
}

async function main(){
  // login admin
  const adminToken = await login('admin','adminpass')
  console.log('admin token len', adminToken && adminToken.length)

  // create product
  const form = new (require('form-data'))();
  form.append('name','LogTest Product')
  form.append('number','LT-001')
  form.append('description','Created by test')
  form.append('status','Available')
  const create = await fetch(`${base}/api/products`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: form })
  const created = await create.json()
  console.log('created', created.id)

  // login user
  const userToken = await login('user','userpass')
  console.log('user token len', userToken && userToken.length)

  // user changes status
  const statusResp = await fetch(`${base}/api/products/${created.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${userToken}`, 'content-type':'application/json' }, body: JSON.stringify({ status: 'Sold out' }) })
  console.log('user status resp', statusResp.status)

  // admin updates price
  const adminUpdate = await fetch(`${base}/api/products/${created.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${adminToken}`, 'content-type':'application/json' }, body: JSON.stringify({ price: 99.99 }) })
  console.log('admin update status', adminUpdate.status)

  // admin delete
  const del = await fetch(`${base}/api/products/${created.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } })
  console.log('delete status', del.status)
}

main().catch(e => console.error(e))
