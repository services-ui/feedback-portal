/**
 * Local stand-in for the Apps Script Web App — runs the REAL Code.gs (mocked Google services)
 * behind HTTP so the frontend can be tested end-to-end before deploying.
 *
 *   node backend/test/mock-server.mjs            → http://localhost:8787/exec
 *   MOCK_MODE=fail    node …                     → every POST returns a server error
 *   MOCK_MODE=network node …                     → every POST drops the connection
 *   MOCK_DELAY_MS=2500 node …                    → slow network
 *
 *   GET /rows  → the rows written so far (what would be in the Google Sheet)
 */
import http from 'node:http'
import { createSandbox } from './gas-sandbox.mjs'

const PORT = Number(process.env.PORT || 8787)
const MODE = process.env.MOCK_MODE || 'ok'
const DELAY = Number(process.env.MOCK_DELAY_MS || 600)

const sb = createSandbox()
sb.context.setup()

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    if (req.method === 'GET' && url.pathname === '/rows') {
      res.writeHead(200, cors)
      return res.end(JSON.stringify(sb.feedbackRows(), null, 2))
    }
    if (req.method === 'GET' && url.pathname === '/exec') {
      res.writeHead(200, cors)
      return res.end(JSON.stringify(sb.get()))
    }
    if (req.method === 'POST' && url.pathname === '/exec') {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        setTimeout(() => {
          if (MODE === 'network') return req.socket.destroy()
          if (MODE === 'fail') {
            res.writeHead(500, cors)
            return res.end(JSON.stringify({ ok: false, status: 'error', code: 'SERVER_ERROR', message: 'Something went wrong on our side. Please try again.' }))
          }
          const out = sb.post(body)
          console.log(`[mock] ${out.ok ? 'OK ' : 'ERR'} ${out.duplicate ? '(duplicate) ' : ''}${out.message}${out.errors ? ' ' + JSON.stringify(out.errors) : ''}`)
          res.writeHead(200, cors)
          res.end(JSON.stringify(out))
        }, DELAY)
      })
      return
    }
    res.writeHead(404, cors)
    res.end(JSON.stringify({ ok: false }))
  })
  .listen(PORT, () => console.log(`[mock] Apps Script stand-in on http://localhost:${PORT}/exec  (mode=${MODE})`))
