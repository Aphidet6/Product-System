const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const file = path.join(__dirname, 'users.json')
if (!fs.existsSync(file)) {
  console.error('users.json not found')
  process.exit(1)
}

const backup = file + '.bak.' + Date.now()
fs.copyFileSync(file, backup)
console.log('Backup created at', backup)

const data = JSON.parse(fs.readFileSync(file, 'utf8'))
const exists = data.find(u => u.username === 'master')
if (exists) {
  console.log('Master user already exists')
  process.exit(0)
}

const password = 'MasterPass123!'
const hash = bcrypt.hashSync(password, 10)
data.push({ username: 'master', passwordHash: hash, role: 'MasterAdmin' })
fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
console.log('MasterAdmin added with username=master and password=' + password)