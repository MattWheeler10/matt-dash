import { proxyRequest } from '../_lib/proxy.js'

export default async function handler(req, res) {
  await proxyRequest(req, res, 'https://api.football-data.org', {
    'X-Auth-Token': process.env.FOOTBALL_API_KEY ?? '',
  })
}
