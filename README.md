# fastify-override

![ci](https://github.com/matthyk/fastify-override/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/matthyk/fastify-override/actions/workflows/codeql.yml/badge.svg)


Override any plugins, decorators and hooks in your Fastify application. This is useful for mocking specific 
functionalities when testing your application. For the motivation of this plugin see [here](#why-is-this-plugin-useful).

> You should use this plugin only for testing purposes.

## Install

```sh
npm install fastify-override --save-dev
```

### Compatibility

| Plugin Version | Fastify Version | Node Versions |
|----------------|:---------------:|---------------|
| 1.x            | 4.x             | 16, 18        |

## Usage

TODO

## Why is this plugin useful?

Let's assume our Fastify application has the following structure:

```
│   
├── routes
│   ├── users/
│   ├── articles/
│   ├── ...
│   ...
│
├── plugins
│   ├── postgres
│   ├── auth
│   ├── ...
│   ...
│
├── test
│   ├── users-routes.test.js
│   ├── ...
│   ...
│   
└── server.js
```

In most cases, our `server.js` file will look like this:

```js
import fastifyAutoload from '@fastify/autoload'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function (app, opts) {
  
  app.register(fastifyAutoload, {
    dir: join(__dirname, 'plugins'),
    encapsulate: false
  })

  app.register(fastifyAutoload, {
    dir: join(__dirname, 'routes'),
    encapsulate: true
  })
  
}
```

We would now like to test the routes within the `routes/users` folder. Let's do this in the 
`users-routes.test.js` file with the `tap` testing library.

```js
import t from 'tap'
import Fastify from 'fastify'
import application from '../server.js'

t.test('test users routes', async t => {
  const app = Fastify()
  
  app.register(application)
  
  // app.pg is undefined
  // so we cannot mock like this
  // app.pg.query = () => 'mocked value'
})
```

Because a new context is created by the register call, we have no access to all functionalities that are added by the 
plugins in the plugin folder. For example, we couldn't mock the Postgres plugin now simply because we don't have access 
to the decorated `pg` value that the plugin actually decorates the Fastify instance with. You could of course argue that 
by using `fastify-plugin` we could prevent the creation of a new context. That would work in this example, but what if 
we want to mock a plugin, decorator or hook that is deeper in the plugin hierarchy? 
This is exactly where `fastify-override` comes to the rescue. `fastify-override` makes it possible to override plugins, 
decorators and hooks in the entire plugin hierarchy. 

Let's look at a code example:
```js
import t from 'tap'
import Fastify from 'fastify'
import application from '../server.js'

t.test('test users routes', async t => {
  const app = Fastify()

  await app.register(fastifyOverride, {
    override: {
      plugins: {
        // We can mock a whole plugin...
        '@fastify/postgres': fp(async app => {
          app.decorate('pg', {
            query: () => 'mocked value',
          })
        })
      },
      decorators: {
        decorate: {
          // ...or just selected decorators 
          pg: {
            query: () => 'mocked value'
          }
        }
      }
    }
  })
  
  app.register(application)
  
  await app.ready()
  
  app.pg.query() // returns 'mocked value'
})
```

As we can see, this plugin allows us to overwrite entire plugins or just selected decorators. Thereby it does not matter 
how deep in the plugin hierarchy the plugin and/or the decorators are registered.
