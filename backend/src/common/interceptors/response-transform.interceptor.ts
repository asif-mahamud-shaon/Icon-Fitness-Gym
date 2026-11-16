import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, StandardApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardApiResponse<T>> {
    return next.handle().pipe(
      map((payload: any) => {
        if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
          return {
            ...payload,
            timestamp: payload.timestamp || new Date().toISOString(),
          };
        }

        if (payload && typeof payload === 'object' && 'items' in payload && 'meta' in payload) {
          return {
            success: true,
            message: payload.message || 'Success',
            data: payload.items,
            meta: payload.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          message: payload?.message && Object.keys(payload).length === 1 ? payload.message : 'Success',
          data: payload,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

