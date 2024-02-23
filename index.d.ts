import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  onRequestAsyncHookHandler,
  onRequestHookHandler, preParsingAsyncHookHandler, preParsingHookHandler
} from 'fastify';

type FastifyOverride = FastifyPluginAsync<fastifyOverride.PluginOptions>;

declare namespace fastifyOverride {

  export type PluginOptions = {
    override?: {
      decorators?: {
        decorate?: Record<string | symbol, unknown>
        decorateRequest?: Record<string | symbol, unknown>
        decorateReply?: Record<string | symbol, unknown>
      },
      plugins?: Record<string, FastifyPluginCallback | FastifyPluginAsync>,
      hooks?: {
        onRequest?: onRequestHookHandler | onRequestAsyncHookHandler,
        preParsing?: preParsingHookHandler | preParsingAsyncHookHandler,
      }
    }
  }

  export const fastifyOverride: FastifyOverride
  export { fastifyOverride as default }
}

declare function fastifyOverride(...params: Parameters<FastifyOverride>): ReturnType<FastifyOverride>

export = fastifyOverride
