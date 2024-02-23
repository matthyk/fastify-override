const fp = require('fastify-plugin')

module.exports = fp(async (app) => {
  app.addHook('onRequest', async () => {})
  app.addHook('preParsing', async () => {})
}, { name: 'hooksPlugin' })
