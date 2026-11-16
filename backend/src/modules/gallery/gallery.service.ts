import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GalleryCategory, MediaType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  getCloudinaryConfigStatus() {
    const enabled =
      this.configService.get<string>('CLOUDINARY_ENABLED') === 'true';
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    return {
      cloudinaryEnabled: enabled,
      configured: Boolean(
        enabled &&
          cloudName &&
          cloudName !== 'placeholder_cloud_name' &&
          cloudName !== 'your_cloud_name',
      ),
      mode: enabled ? 'CLOUDINARY_LIVE' : 'CONFIGURABLE_URL_ADAPTER',
    };
  }

  async findPublic(category?: GalleryCategory) {
    return this.prisma.gallery.findMany({
      where: {
        isPublished: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findAllAdmin() {
    const items = await this.prisma.gallery.findMany({
      include: {
        uploadedByUser: {
          select: { fullName: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      items,
      integrationStatus: this.getCloudinaryConfigStatus(),
    };
  }

  private sanitizeMediaUrl(url: string): string {
    const trimmed = String(url || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Media URL is required.');
    }
    if (
      /^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed) &&
      trimmed.length <= 8_000_000
    ) {
      return trimmed;
    }
    if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed) || trimmed.startsWith('/')) {
      return trimmed.slice(0, 2048);
    }
    throw new BadRequestException(
      'Unsupported media URL format. Use HTTPS/HTTP URLs, relative paths, or JPEG/PNG/WEBP uploads.',
    );
  }

  async create(
    actor: AuthenticatedUser,
    dto: {
      title: string;
      caption?: string;
      mediaType?: MediaType;
      mediaUrl: string;
      thumbnailUrl?: string;
      category?: GalleryCategory;
      isPlaceholder?: boolean;
      isPublished?: boolean;
      sortOrder?: number;
    },
  ) {
    const safeMediaUrl = this.sanitizeMediaUrl(dto.mediaUrl);
    const safeThumbUrl = dto.thumbnailUrl
      ? this.sanitizeMediaUrl(dto.thumbnailUrl)
      : safeMediaUrl;
    const created = await this.prisma.gallery.create({
      data: {
        title: dto.title.trim(),
        caption: dto.caption || null,
        mediaType: dto.mediaType || MediaType.IMAGE,
        mediaUrl: safeMediaUrl,
        thumbnailUrl: safeThumbUrl,
        category: dto.category || GalleryCategory.FACILITY,
        isPlaceholder: dto.isPlaceholder ?? false,
        isPublished: dto.isPublished ?? true,
        sortOrder: Number(dto.sortOrder ?? 0),
        uploadedByUserId: actor.id,
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GALLERY_MEDIA_CREATED',
      entityType: 'Gallery',
      entityId: created.id,
      summary: `Added gallery item '${created.title}' (${created.category})`,
    });

    return created;
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: Record<string, any>,
  ) {
    const existing = await this.prisma.gallery.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gallery item not found.');

    const updated = await this.prisma.gallery.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        ...(dto.mediaType ? { mediaType: dto.mediaType } : {}),
        ...(dto.mediaUrl ? { mediaUrl: this.sanitizeMediaUrl(dto.mediaUrl) } : {}),
        ...(dto.thumbnailUrl !== undefined
          ? { thumbnailUrl: dto.thumbnailUrl ? this.sanitizeMediaUrl(dto.thumbnailUrl) : null }
          : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.isPlaceholder !== undefined
          ? { isPlaceholder: Boolean(dto.isPlaceholder) }
          : {}),
        ...(dto.isPublished !== undefined
          ? { isPublished: Boolean(dto.isPublished) }
          : {}),
        ...(dto.sortOrder !== undefined
          ? { sortOrder: Number(dto.sortOrder) }
          : {}),
      },
    });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GALLERY_MEDIA_UPDATED',
      entityType: 'Gallery',
      entityId: id,
      summary: `Updated gallery item '${updated.title}'`,
    });

    return updated;
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const existing = await this.prisma.gallery.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gallery item not found.');

    await this.prisma.gallery.delete({ where: { id } });

    await this.auditLogsService.log({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: 'GALLERY_MEDIA_DELETED',
      entityType: 'Gallery',
      entityId: id,
      summary: `Deleted gallery item '${existing.title}'`,
    });

    return { deleted: true };
  }
}

