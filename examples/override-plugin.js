const fastifyOverride = require('../index')
const t = require('tap')
const Fastify = require('fastify')
const fp = require('fastify-plugin')

// This simulates the @fastify/postgres plugin https://github.com/fastify/fastify-postgres
const fastifyPostgres = fp((app) => {}, {
  name: '@fastify/postgres'
})

const users = async app => {
  app.get('/', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'number'
              },
              name: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  }, async function () {
    return (await this.pg.query('SELECT * from "users" LIMIT 10')).rows
  })
}

const server = async (app) => {
  app.register(fastifyPostgres, {
    connectionString: 'postgres://postgres@localhost/postgres'
  })

  app.register(users, {
    prefix: 'users'
  })
}

t.test('GET /users - 200', async t => {
  const app = Fastify()

  await app.register(fastifyOverride, {
    override: {
      plugins: {
        '@fastify/postgres': fp(async (instance) => {
          instance.decorate('pg', {
            query: async () => {
              return {
                rows: [
                  {
                    id: 1,
                    name: 'Matthias',
                    password: 'test123'
                  },
                  {
                    id: 3,
                    name: 'Max',
                    password: 'alligator2'
                  }
                ]
              }
            }
          })
        })
      }
    }
  })

  app.register(server)

  const response = await app.inject({
    url: '/users',
    method: 'GET'
  })

  const body = response.json()

  t.equal(response.statusCode, 200)
  t.equal(body.length, 2)
  t.matchOnly(body, [
    {
      id: /\d+/,
      name: /.+/
    },
    {
      id: /\d+/,
      name: /.+/
      // password: /.*/ <-- this would fail
    }
  ])
})
