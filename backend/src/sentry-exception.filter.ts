import { ArgumentsHost, Catch, HttpException } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import * as Sentry from '@sentry/bun'

// Reports unexpected (5xx) errors to Sentry, then falls through to Nest's
// default handling. 4xx business errors stay out of the error tracker.
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException ? exception.getStatus() : 500
    if (status >= 500) Sentry.captureException(exception)
    super.catch(exception, host)
  }
}
