import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  onCloseAsyncHookHandler,
  onCloseHookHandler,
  onErrorAsyncHookHandler,
  onErrorHookHandler,
  onListenAsyncHookHandler,
  onListenHookHandler,
  onReadyAsyncHookHandler,
  onReadyHookHandler,
  onRegisterHookHandler,
  onRequestAbortAsyncHookHandler,
  onRequestAbortHookHandler,
  onRequestAsyncHookHandler,
  onRequestHookHandler,
  onResponseAsyncHookHandler,
  onResponseHookHandler,
  onRouteHookHandler,
  onSendAsyncHookHandler,
  onSendHookHandler,
  onTimeoutAsyncHookHandler,
  onTimeoutHookHandler,
  preHandlerAsyncHookHandler,
  preHandlerHookHandler,
  preParsingAsyncHookHandler,
  preParsingHookHandler,
  preSerializationAsyncHookHandler,
  preSerializationHookHandler,
  preValidationAsyncHookHandler,
  preValidationHookHandler,
} from 'fastify';
// wait for https://github.com/fastify/fastify/pull/5335
import { preCloseAsyncHookHandler, preCloseHookHandler } from "fastify/types/hooks";

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
        preValidation?: preValidationHookHandler | preValidationAsyncHookHandler,
        preHandler?: preHandlerHookHandler | preHandlerAsyncHookHandler,
        preSerialization?: preSerializationHookHandler | preSerializationAsyncHookHandler,
        onError?: onErrorHookHandler | onErrorAsyncHookHandler,
        onSend?: onSendHookHandler | onSendAsyncHookHandler,
        onResponse?: onResponseHookHandler | onResponseAsyncHookHandler,
        onTimeout?: onTimeoutHookHandler | onTimeoutAsyncHookHandler,
        onListen?: onListenHookHandler | onListenAsyncHookHandler,
        onReady?: onReadyHookHandler | onReadyAsyncHookHandler,
        preClose?: preCloseHookHandler | preCloseAsyncHookHandler,
        onClose?: onCloseHookHandler | onCloseAsyncHookHandler,
        onRoute?: onRouteHookHandler,
        onRegister?: onRegisterHookHandler,
        onRequestAbort?: onRequestAbortHookHandler | onRequestAbortAsyncHookHandler,
      }
    }
  }

  export const fastifyOverride: FastifyOverride
  export { fastifyOverride as default }
}

declare function fastifyOverride(...params: Parameters<FastifyOverride>): ReturnType<FastifyOverride>

export = fastifyOverride
