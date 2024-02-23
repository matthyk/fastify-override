import { expectAssignable } from 'tsd'
import type { PluginOptions } from "../../index";
import type { DoneFuncWithErrOrRes, FastifyInstance, FastifyRequest } from "fastify";

expectAssignable<PluginOptions>({
  override: {
    plugins: {
      str: async (instance: FastifyInstance, opts: Record<never, never>) => {},
      [Symbol.for('sym')]: (instance: FastifyInstance, opts: Record<never, never>, done: DoneFuncWithErrOrRes) => {},
    },
    decorators: {
      decorate: {
        a: 42
      },
      decorateReply: {
        b: "test",
        [Symbol.for('sym')]: true
      },
      decorateRequest: {
        obj: {},
        fn: () => {}
      }
    },
    hooks: {
      onRequest: (request: FastifyRequest) => {},
      preParsing: (request: FastifyRequest) => {}
    }
  }
})
