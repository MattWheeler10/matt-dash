import { proxyRequest } from '../_lib/proxy.js'

export default async function handler(req, res) {
  await proxyRequest(req, res, 'https://www.theguardian.com')
}
