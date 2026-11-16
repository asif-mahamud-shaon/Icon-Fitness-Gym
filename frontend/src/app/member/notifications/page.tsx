'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Card, Button, StatusBadge, Skeleton, EmptyState } from '@/components/ui';

export default function MemberNotificationsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ items: any[]; unreadCount: number }>(
        '/notifications/my',
      );
      setItems(res.items || []);
      setUnreadCount(res.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    await apiFetch('/notifications/read-all', { method: 'PATCH' });
    toast({
      title: 'All Notifications Marked as Read',
      variant: 'success',
    });
    await loadNotifications();
  };

  const handleMarkSingleRead = async (id: string) => {
    await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    await loadNotifications();
  };

  if (loading) {
    return <Skeleton className="h-72" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-white">
            Notifications ({unreadCount} Unread)
          </h1>
          <p className="text-xs font-mono text-[#A1A1AA] mt-1">
            Member Portal <span className="mx-1">&gt;</span>{' '}
            <span className="text-white">Alerts &amp; Updates</span>
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={handleMarkAllRead}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="No Notifications"
          description="You are all caught up!"
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !n.isRead ? 'border-[#C7F464]/60 bg-[#1B1F14]' : ''
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={n.type} />
                  {!n.isRead && (
                    <span className="px-2 py-0.5 rounded-full bg-[#C7F464] text-[#090909] text-[10px] font-bold uppercase">
                      New
                    </span>
                  )}
                  <span className="text-xs font-mono text-[#A1A1AA]">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{n.title}</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {n.message}
                </p>
              </div>
              {!n.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkSingleRead(n.id)}
                >
                  Mark Read
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
