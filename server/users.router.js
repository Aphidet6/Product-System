const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { authMiddleware, requireRole } = require('./auth')
const { z } = require('zod')

const usersFile = path.join(__dirname, 'users.json')

function loadUsers() {
  try { return JSON.parse(fs.readFileSync(usersFile, 'utf8')) } catch (e) { return [] }
}
function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
}

// list users (master admin or admin can view? restrict to master admin)
router.get('/', authMiddleware, requireRole('MasterAdmin'), (req, res) => {
  const users = loadUsers().map(u => ({ username: u.username, role: u.role }))
  res.json(users)
})

// create user (master only)
const createUserSchema = z.object({ username: z.string().min(1), password: z.string().min(6), role: z.enum(['User','Admin','MasterAdmin']) })

router.post('/', authMiddleware, requireRole('MasterAdmin'), (req, res) => {
  const parsed = createUserSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ error: 'invalid body', details: parsed.error.format() })
  const { username, password, role } = parsed.data
  const users = loadUsers()
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'user exists' })
  const hash = bcrypt.hashSync(password || '', 10)
  users.push({ username, passwordHash: hash, role })
  saveUsers(users)
  res.status(201).json({ username, role })
})

// update user (master only) - allow role change and password reset
const updateUserSchema = z.object({ role: z.optional(z.enum(['User','Admin','MasterAdmin'])), password: z.optional(z.string().min(6)), newUsername: z.optional(z.string().min(1)) })

router.put('/:username', authMiddleware, requireRole('MasterAdmin'), (req, res) => {
  const uname = req.params.username
  const parsed = updateUserSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ error: 'invalid body', details: parsed.error.format() })
  const { role, password, newUsername } = parsed.data
  const users = loadUsers()
  const idx = users.findIndex(u => u.username === uname)
  if (idx === -1) return res.status(404).json({ error: 'not found' })

  // rename user if requested
  if (newUsername && newUsername !== uname) {
    if (users.find(u => u.username === newUsername)) {
      return res.status(409).json({ error: 'username exists' })
    }
    users[idx].username = newUsername
  }

  if (role) users[idx].role = role
  if (password) users[idx].passwordHash = bcrypt.hashSync(password || '', 10)
  saveUsers(users)
  res.json({ username: users[idx].username, role: users[idx].role })
})

// delete user (master only) - prevent deleting last MasterAdmin
router.delete('/:username', authMiddleware, requireRole('MasterAdmin'), (req, res) => {
  const uname = req.params.username
  const users = loadUsers()
  const idx = users.findIndex(u => u.username === uname)
  if (idx === -1) return res.status(404).json({ error: 'not found' })
  // check remaining master count
  const masters = users.filter(u => u.role === 'MasterAdmin')
  if (users[idx].role === 'MasterAdmin' && masters.length <= 1) return res.status(400).json({ error: 'cannot delete last MasterAdmin' })
  users.splice(idx, 1)
  saveUsers(users)
  res.status(204).end()
})

module.exports = router
