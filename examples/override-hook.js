const fastifyOverride = require('../index')
const t = require('tap')
const Fastify = require('fastify')

const adminArea = async app => {
  app.addHook('onRequest', (req, reply) => {
    // Some auth strategy
    // ...

    reply.status(401).send('You are not authenticated!')
  })

  app.get('/health', async () => {
    return 'You are a admin!'
  })
}

const server = async (app) => {
  app.register(adminArea, {
    prefix: 'admin'
  })
}

t.test('test admin health endpoint', async t => {
  const app = Fastify()

  await app.register(fastifyOverride, {
    override: {
      hooks: {
        // just bypass the authentication hook
        onRequest: async () => {}
      }
    }
  })

  app.register(server)

  const response = await app.inject({
    url: 'admin/health',
    method: 'GET'
  })

  t.equal(response.statusCode, 200)
  t.equal(response.body, 'You are a admin!')
})
