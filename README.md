# fastify-override

![CI](https://github.com/matthyk/fastify-override/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/matthyk/fastify-override/actions/workflows/codeql.yml/badge.svg)

Override any plugin, decorator or hook in your Fastify application. This is useful for mocking specific 
functionalities when testing your application. For the motivation of this plugin see [here](#why-is-this-plugin-useful).

> Note: You should use this plugin only for testing purposes.

## Install

```sh
npm install fastify-override --save-dev
```

### Compatibility

| Plugin Version | Fastify Version | Node Versions |
|----------------|:---------------:|---------------|
| 1.x            |       4.x       | 18, 20, 21    |
| 2.x            |       5.x       | 20, 22        |

## Usage

This plugin allows you to override specific plugins, decorators and hooks within the plugin hierarchy. This can happen 
from any level within the hierarchy, and you can also register this plugin multiple times. But as soon as the plugin is 
to be used, the register call must be awaited so that all subsequently added plugins, decorators and hooks are considered.

> Note: Only plugins that are not registered as promise are supported. `app.register(import('...'))` would result in 
> incorrect behaviour. If this occurs, the plugin will log a message accordingly.

```js

app.decorate('foo', 'bar')

await app.register(fastifyOverride, {
  override: {
    decorators: {
      decorate: {
        foo: 'overridden',
        num: 42
      }
    }
  }
})

app.decorate('num', 1)

app.foo // === 'bar'
app.num // === 42
```

As you can see above, only the decorators (and of course plugins and hooks) that were added after the plugin was 
registered are actually taken into account. There are some differences in the way the plugins, decorators and hooks are 
overridden. We will therefore briefly look at these 3 separately.

### Override Plugins

Only plugins that have been assigned a name with `fastify-plugin` can be overridden. This name can then be used to 
specify which plugin should be used to override it.

```js
const plg = fp(async app => {}, {
  name: 'myPlugin' // <-- Therefore, this must match with...
})

await app.register(fastifyOverride, {
  override: {
    plugins: {
      myPlugin: fp(async () => {}) // ...this name
    }
  }
})
```

Keep in mind that the encapsulation behavior of the plugin can also be changed by using or not using `fastify-plugin`.

### Override Decorators

Decorators are identified by their name and type. Therefore, the plugin with the following options

```js
{
  override: {
    decorators: {
      decorateReply: {
        num: 1
      }
    }
  }
}
```
would override `app.decorateReply('num', 2)` but not `app.decorateRequest('num', 3)`.

### Override Hooks

For each [hook type](https://fastify.dev/docs/latest/Reference/Hooks/), you can provide one function. This function then 
overrides all hooks of this type. This can of course lead to different hook functions being overridden with the same function.
Please note that only hooks that have been added via the `addHook` API are being checked.

```js
await app.register(fastifyOverride, {
  override: {
    hooks: {
      onRequest: async () => {},
      onSend: async () => {}
    }
  }
})
```

## Options

The following options are available.

```js
import Fastify from 'fastify'

const app = Fastify()

await app.register(import('fastify-override'), {
  override: {
    plugins: {},
    decorators: {
      decorate: {},
      decorateRequest: {},
      decorateReply: {}
    },
    hooks: {}
  }
})
```

### override

Use the `override` object to specify which decorators, which plugins and which hooks are to be overwritten.

```js
import Fastify from 'fastify'

const app = Fastify()

await app.register(import('fastify-override'), {
  override: {
    plugins: {
      '@fastifyPostgres': async app => {}
    },
    decorators: {
      decorate: {
        db: {
          query: async () => {}
        } 
      }
    },
    hooks: {
      onRequest: async (req, reply) => {}
    }
  }
})
```


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
          // ...or just specific decorators 
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

As we can see, this plugin allows us to overwrite entire plugins or just specific decorators. Thereby it does not matter 
how deep in the plugin hierarchy the plugin and/or the decorators are registered.

## License

Licensed under [MIT](./LICENSE).
