import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParserPkg from 'cookie-parser';
import {
  json,
  urlencoded,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { gzipSync } from 'zlib';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { SanitizeInputPipe } from './common/pipes/sanitize-input.pipe';
import { validateSecurityEnvironment } from './common/security/secrets.util';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn'] : ['error', 'warn', 'log'],
  });
  const configService = app.get(ConfigService);

  validateSecurityEnvironment((key) => configService.get<string>(key));

  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.disable('x-powered-by');
  expressInstance.set('trust proxy', 1);

  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  const corsOrigin =
    configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
  const corsOrigins = corsOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const isHttpsDeployment = corsOrigins.some((o) => o.startsWith('https://'));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
      noSniff: true,
      hsts: isHttpsDeployment
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
    }),
  );
  const createCookieParser =
    (
      cookieParserPkg as unknown as {
        default?: () => RequestHandler;
      }
    ).default ?? (cookieParserPkg as unknown as () => RequestHandler);
  app.use(createCookieParser());

  const smallJsonParser = json({ limit: '1mb' });
  const largeUploadJsonParser = json({ limit: '10mb' });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.originalUrl.startsWith(
        `/${apiPrefix}/access-control/biometrics/enroll`,
      ) ||
      req.originalUrl.startsWith(`/${apiPrefix}/gallery`) ||
      req.originalUrl.startsWith(`/${apiPrefix}/store/admin/products`) ||
      req.originalUrl.startsWith(`/${apiPrefix}/members`) ||
      req.originalUrl.startsWith(`/${apiPrefix}/settings`) ||
      req.originalUrl.startsWith(`/${apiPrefix}/trainers`) ||
      req.originalUrl.startsWith(`/${apiPrefix}/workouts`) ||
      req.originalUrl.startsWith(`/${apiPrefix}/classes`)
    ) {
      return largeUploadJsonParser(req, res, next);
    }
    return smallJsonParser(req, res, next);
  });
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Lightweight zero-dependency GZIP compression for JSON API payloads > 1KB
  app.use(`/${apiPrefix}`, (req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (!acceptEncoding.includes('gzip')) {
      return next();
    }
    const origJson = res.json.bind(res);
    res.json = ((body?: any) => {
      if (res.headersSent) {
        return origJson(body);
      }
      const serialized = JSON.stringify(body);
      if (!serialized || serialized.length < 1024) {
        return origJson(body);
      }
      const compressed = gzipSync(Buffer.from(serialized, 'utf8'), { level: 1 });
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Vary', 'Accept-Encoding');
      res.removeHeader('Content-Length');
      return res.send(compressed);
    }) as any;
    next();
  });

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new SanitizeInputPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  const enableSwagger =
    configService.get<string>('NODE_ENV') !== 'production' &&
    configService.get<string>('ENABLE_SWAGGER') === 'true';

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Icon Fitness Gym — REST API')
      .setDescription(
        'Production REST API for Icon Fitness Gym (Ashkona, Dakshinkhan, Dhaka, Bangladesh) — Website, Member Portal, Trainer Portal & Admin Dashboard.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(configService.get<string>('PORT') || 4000);
  await app.listen(port);
  logger.log(
    `Icon Fitness Gym API listening on http://localhost:${port}/${apiPrefix}`,
  );
  if (enableSwagger) {
    logger.log(
      `Swagger OpenAPI Documentation available at http://localhost:${port}/api/docs`,
    );
  }
}

bootstrap();

