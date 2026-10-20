import { Suspense } from 'react';
import ChatDetailClient from '@/features/chat/components/chat-detail-client';

export function generateStaticParams() {
  return [{ id: 'new' }];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ConversationDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const conversationId = resolvedParams.id;

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[var(--color-background)] text-[var(--color-text-primary)]">Loading conversation...</div>}>
      <ChatDetailClient conversationId={conversationId} />
    </Suspense>
  );
}
