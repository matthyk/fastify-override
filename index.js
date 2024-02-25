'use strict'

const fp = require('fastify-plugin')

// See https://github.com/fastify/fastify-plugin/blob/4a11ccc90df16b196e3f4746a5321938a87283f2/plugin.js#L46
const kFastifyDisplayName = Symbol.for('fastify.display-name')

async function fastifyOverride (app, opts = {}) {
  const { plugins = {}, decorators = {}, hooks = {} } = opts.override ?? {}

  function overrideDecorate (instance, type) {
    if (!decorators[type]) return

    const original = instance[type]

    app[type] = function override (name, fn, dependencies) {
      const pluginFn = decorators[type][name] ?? fn

      return original.call(this, name, pluginFn, dependencies)
    }
  }

  function overrideRegister (instance) {
    const original = instance.register

    instance.register = function (fn, options) {
      if (isPromiseLike(fn)) {
        instance.log.debug('Promise like plugin function cannot be overridden.')
      }

      if (isBundledOrTypescriptPlugin(fn)) {
        fn = fn.default
      }

      const plugin = (fn[kFastifyDisplayName] && plugins[fn[kFastifyDisplayName]]) ?? fn

      return original.call(this, plugin, options)
    }
  }

  function overrideAddHook (instance) {
    const original = instance.addHook

    instance.addHook = function (name, hook) {
      const hookFn = hooks[name] ?? hook

      original.call(this, name, hookFn)
    }
  }

  // From https://github.com/fastify/avvio/blob/a153be8358ece6a1ed970d0bee2c28a8230175b9/lib/is-bundled-or-typescript-plugin.js#L13-L19
  function isBundledOrTypescriptPlugin (maybeBundledOrTypescriptPlugin) {
    return (
      maybeBundledOrTypescriptPlugin !== null &&
            typeof maybeBundledOrTypescriptPlugin === 'object' &&
            typeof maybeBundledOrTypescriptPlugin.default === 'function'
    )
  }

  // From https://github.com/fastify/avvio/blob/a153be8358ece6a1ed970d0bee2c28a8230175b9/lib/is-promise-like.js#L7-L13
  function isPromiseLike (maybePromiseLike) {
    return (
      maybePromiseLike !== null &&
        typeof maybePromiseLike === 'object' &&
        typeof maybePromiseLike.then === 'function'
    )
  }

  overrideDecorate(app, 'decorate')
  overrideDecorate(app, 'decorateReply')
  overrideDecorate(app, 'decorateReply')
  overrideRegister(app)
  overrideAddHook(app)
}

const plugin = fp(fastifyOverride, {
  name: 'fastify-override',
  fastify: '4.x'
})

module.exports = plugin
module.exports.default = plugin
module.exports.fastifyOverride = fastifyOverride
