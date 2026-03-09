export async function proxyRequest(req, res, targetBase, extraHeaders = {}) {
  const pathParts = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [req.query.path]
      : []

  const targetPath = pathParts.join('/')

  const params = { ...req.query }
  delete params.path
  const queryString = new URLSearchParams(params).toString()

  const url = `${targetBase}/${targetPath}${queryString ? '?' + queryString : ''}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Dashboard/1.0)',
        ...extraHeaders,
      },
    })

    const contentType = response.headers.get('content-type') ?? ''
    const buffer = await response.arrayBuffer()

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', contentType)
    res.status(response.status).send(Buffer.from(buffer))
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
}
