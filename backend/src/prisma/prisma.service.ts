import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

function resolveIconFitnessDatabaseUrl(): string {
  // 1. In local development, prefer backend/.env if present so local .env overrides stale OS variables
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1].trim();
        return process.env.DATABASE_URL;
      }
    }
  } catch {
    // fallback below
  }

  // 2. In cloud / Vercel / Neon deployments, use injected process.env.DATABASE_URL
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return process.env.DATABASE_URL.trim();
  }

  // 3. Local fallback when no .env or DATABASE_URL is configured
  const fallback =
    'postgresql://postgres:1234@localhost:5432/Icon-Fitness-Gym?schema=public';
  process.env.DATABASE_URL = fallback;
  return fallback;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = resolveIconFitnessDatabaseUrl();
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL database (Icon-Fitness-Gym)');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
