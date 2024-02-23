import t from 'tap'
import tsPlugin from './source/typescript-plugin'
import Fastify from 'fastify'
import fp from 'fastify-plugin'
import fastifyOverride from "../index";

declare module 'fastify' {
  export interface FastifyInstance {
    class: string
  }
}

t.test('should work for typescript projects', async t => {
  const app = Fastify()

  await app.register(fastifyOverride, {
    override: {
      plugins: {
        tsPlugin: fp(async app => { app.decorate('class', 'EXP') })
      }
    }
  })

  app.register(tsPlugin)

  await app.ready()

  t.equal(app.class, 'EXP')

  await app.close()
})
