const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const file = path.join(__dirname, 'users.json')
const backup = path.join(__dirname, `users.json.bak.${Date.now()}`)

if (!fs.existsSync(file)) {
  console.error('users.json not found')
  process.exit(1)
}

fs.copyFileSync(file, backup)
console.log('Backup created at', backup)

const users = JSON.parse(fs.readFileSync(file, 'utf8'))
const saltRounds = 10

const updated = users.map(u => {
  if (u.passwordHash) return u
  const hash = bcrypt.hashSync(u.password || '', saltRounds)
  return { username: u.username, passwordHash: hash, role: u.role }
})

fs.writeFileSync(file, JSON.stringify(updated, null, 2))
console.log('Migration complete: users.json now contains passwordHash')
