const fp = require('fastify-plugin')
const fastifyAutoload = require('@fastify/autoload')
const path = require('node:path')
const Fastify = require('fastify')
const t = require('tap')
const fastifyOverride = require('../index.js')

t.test('should work with @fastify/autoload', async t => {
  const app = Fastify()
  const hook = t.captureFn(async () => {})

  await app.register(fastifyOverride, {
    override: {
      decorators: {
        decorate: {
          bar: 'overridden'
        }
      },
      plugins: {
        hooksPlugin: fp(async (app) => { app.addHook('preParsing', hook) })
      }
    }
  })

  app.register(fastifyAutoload, {
    dir: path.join(__dirname, 'source')
  })

  app.get('/', async () => 'Done')

  await app.inject({ method: 'GET', url: '/' })

  t.equal(hook.calls.length, 1)
  t.equal(app.bar, 'overridden')
  t.equal(app.foo, 42)

  await app.close()
})
