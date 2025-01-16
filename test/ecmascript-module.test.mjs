import t from 'tap'
import Fastify from 'fastify'
import fp from 'fastify-plugin'
import fastifyOverride from '../index.js'

t.test('ecmascript modules', async t => {
  t.test('should use default export from module namespace object', async t => {
    const app = Fastify()

    await app.register(fastifyOverride, {
      override: {
        plugins: {
          decoratorPlugin: fp(async (app) => { app.decorate('foo', 'bar') })
        }
      }
    })

    app.register(await import('./source/decorator-plugin.js'))

    await app.ready()

    t.equal(app.foo, 'bar')

    await app.close()
  })

  t.test('should print debug log for promise like plugin fn', async t => {
    const loggerInstance = {
      debug: (msg) => {},
      info: (msg) => {},
      error: (msg) => {},
      fatal: (msg) => {},
      warn: (msg) => {},
      trace: (msg) => {},
      child: () => loggerInstance
    }

    const debugLog = t.capture(loggerInstance, 'debug')

    const app = Fastify({ loggerInstance })

    await app.register(fastifyOverride)

    app.register(import('./source/decorator-plugin.js'))

    await app.ready()

    t.match(debugLog(), [
      { args: [/cannot be overridden/] }
    ])

    await app.close()
  })
})
