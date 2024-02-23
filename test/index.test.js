const fp = require('fastify-plugin')
const Fastify = require('fastify')
const t = require('tap')
const fastifyOverride = require('../index.js')

t.test('override plugins', async t => {
  let app

  t.beforeEach(async () => {
    app = Fastify()
  })

  t.afterEach(async () => {
    await app.close()
    app = null
  })

  t.test('override simple plugin', async t => {
    await app.register(fastifyOverride, {
      override: {
        plugins: {
          decoratorPlugin: fp(async (app) => { app.decorate('foo', 'bar') })
        }
      }
    })

    app.register(require('./source/decorator-plugin.js'))

    await app.ready()

    t.equal(app.foo, 'bar')
  })

  t.test('override plugin twice', async t => {
    const plg = fp(async () => {}, {
      encapsulate: true,
      name: 'plg'
    })

    const overridePlg = t.captureFn(async () => {})

    await app.register(fastifyOverride, {
      override: {
        plugins: {
          plg: overridePlg
        }
      }
    })

    app.register(async instance => {
      instance.register(plg)
    })
    app.register(async instance => {
      instance.register(plg)
    })

    await app.ready()

    t.equal(overridePlg.calls.length, 2)
  })

  t.test('override plugin after same plugin got already registered', async t => {
    const plg = fp(async () => {}, {
      encapsulate: true,
      name: 'plg'
    })

    const overridePlg = t.captureFn(async () => {})

    await app.register(async instance => {
      await instance.register(plg)
    })

    await app.register(fastifyOverride, {
      override: {
        plugins: {
          plg: overridePlg
        }
      }
    })

    app.register(async instance => {
      instance.register(plg)
    })

    await app.ready()

    t.equal(overridePlg.calls.length, 1)
  })

  t.test('override plugin encapsulation behaviour', async t => {
    await app.register(fastifyOverride, {
      override: {
        plugins: {
          decoratorPlugin: async (app) => { app.decorate('foo', 'bar') }
        }
      }
    })

    app.register(require('./source/decorator-plugin.js'))

    await app.ready()

    t.notOk(app.foo)
  })

  t.test('do not override plugins without name', async t => {
    await app.register(fastifyOverride, {
      override: {
        plugins: {
          decoratorPlugin: async (app) => { app.decorate('foo', 'bar') }
        }
      }
    })

    app.register(fp(async () => { app.decorate('foo', 42) }))

    await app.ready()

    t.equal(app.foo, 42)
  })
})

t.test('override decorators', async t => {
  let app

  t.beforeEach(async () => {
    app = Fastify()
  })

  t.afterEach(async () => {
    await app.close()
    app = null
  })

  t.test('only override existing decorator', async t => {
    await app.register(fastifyOverride, {
      override: {
        decorators: {
          decorate: {
            foo: 17
          }
        }
      }
    })

    await app.ready()

    t.notOk(app.foo)
  })

  t.test('simple decorator override', async t => {
    await app.register(fastifyOverride, {
      override: {
        decorators: {
          decorate: {
            foo: 17
          }
        }
      }
    })

    app.register(require('./source/decorator-plugin.js'))

    await app.ready()

    t.equal(app.foo, 17)
    t.equal(app.bar, 'test')
  })
})

t.test('override hooks', async t => {
  let app

  t.beforeEach(async () => {
    app = Fastify()
  })

  t.afterEach(async () => {
    await app.close()
    app = null
  })

  t.test('simple override hook', async t => {
    const onRequest = t.captureFn(async () => {})
    const onClose = t.captureFn(async () => {})

    await app.register(fastifyOverride, {
      override: {
        hooks: {
          onRequest,
          onClose
        }
      }
    })

    app.register(require('./source/hooks-plugin'))

    app.get('/', async () => 'Done')

    await app.inject({ method: 'GET', url: '/' })

    t.equal(onRequest.calls.length, 1)
    t.equal(onClose.calls.length, 0)
  })

  t.test('only override hooks after plugin registration', async t => {
    const onRequest = t.captureFn(async () => {})
    const onRequest2 = t.captureFn(async () => {})
    const preParsing = t.captureFn(async () => {})

    await app.register(require('./source/hooks-plugin'))

    await app.register(fastifyOverride, {
      override: {
        hooks: {
          onRequest,
          preParsing
        }
      }
    })

    app.addHook('onRequest', onRequest2)
    app.get('/', async () => 'Done')

    await app.inject({ method: 'GET', url: '/' })

    t.equal(onRequest.calls.length, 1)
    t.equal(preParsing.calls.length, 0)
    t.equal(onRequest2.calls.length, 0)
  })

  t.test('override multiple times', async t => {
    const app = Fastify()

    const onRequest = t.captureFn(async () => {})
    const onClose = t.captureFn(async () => {})

    await app.register(fastifyOverride, {
      override: {
        hooks: {
          onRequest,
          onClose
        }
      }
    })

    app.register(require('./source/hooks-plugin'))

    app.addHook('onRequest', async () => {})
    app.get('/', async () => 'Done')

    await app.inject({ method: 'GET', url: '/' })
    await app.close()

    t.equal(onRequest.calls.length, 2)
  })
})
