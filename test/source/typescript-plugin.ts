import fp from 'fastify-plugin'

export default fp(async app => {
  app.decorate('class', 'NP')
}, {
  name: 'tsPlugin'
})
