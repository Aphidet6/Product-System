const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const usersFile = path.join(__dirname, 'users.json');
const SECRET = 'dev-secret-change-me';

function loadUsers() {
  try { return JSON.parse(fs.readFileSync(usersFile, 'utf8')) } catch (e) { return [] }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const users = loadUsers()
  const u = users.find(x => x.username === username && x.password === password)
  if (!u) return res.status(401).json({ error: 'invalid credentials' })
  const token = jwt.sign({ username: u.username, role: u.role }, SECRET, { expiresIn: '8h' })
  res.json({ token, role: u.role })
})

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' })
  const token = auth.slice(7)
  try {
    const data = jwt.verify(token, SECRET)
    req.user = data
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' })
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'missing token' })
    if (req.user.role !== role) return res.status(403).json({ error: 'forbidden' })
    next()
  }
}

module.exports = { router, authMiddleware, requireRole, SECRET };
