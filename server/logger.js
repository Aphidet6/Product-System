const path = require('path')
const fs = require('fs')
const { createLogger, format, transports } = require('winston')
require('winston-daily-rotate-file')

const LOGS_DIR = path.join(__dirname, 'logs')
try { fs.mkdirSync(LOGS_DIR, { recursive: true }) } catch (e) {}

const rotateTransport = new transports.DailyRotateFile({
  filename: path.join(LOGS_DIR, 'actions-%DATE%.jsonl'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '30d',
  utc: true,
  format: format.printf(info => JSON.stringify(info.message))
})

const logger = createLogger({
  level: 'info',
  transports: [
    rotateTransport,
    new transports.Console({
      format: format.printf(info => typeof info.message === 'string' ? info.message : JSON.stringify(info.message))
    })
  ],
  exitOnError: false
})

function logAction(action, payload = {}) {
  const record = Object.assign({ action, ts: new Date().toISOString() }, payload)
  logger.info(record)
}

module.exports = { logAction }
