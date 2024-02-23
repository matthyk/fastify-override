const fp = require('fastify-plugin')

module.exports = fp(async (app) => {
  app.decorate('foo', 42)
  app.decorate('bar', 'test')
}, { name: 'decoratorPlugin' })
