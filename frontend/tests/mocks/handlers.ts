import { http, HttpResponse } from 'msw';
import { makeUser, makeConversation, makeMessage, makePreferences } from './factories';

export const handlers = [
  http.options('*', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/auth/me', () => {
    return HttpResponse.json(makeUser());
  }),

  http.post('*/auth/login', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({
      message: 'Login successful',
      user: makeUser({ email: (body as any).email || 'test@example.com' }),
    });
  }),

  http.post('*/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  http.post('*/auth/refresh', () => {
    return HttpResponse.json({ message: 'Token refreshed successfully' });
  }),

  http.get('*/agent/conversations', () => {
    return HttpResponse.json([
      makeConversation({ id: 'conv-1', title: 'First Conversation' }),
      makeConversation({ id: 'conv-2', title: 'Second Conversation' }),
    ]);
  }),

  http.post('*/agent/conversations', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json(
      makeConversation({
        title: (body as any).title || 'New Conversation',
      })
    );
  }),

  http.get('*/agent/conversations/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json(makeConversation({ id: String(id) }));
  }),

  http.patch('*/agent/conversations/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json(
      makeConversation({
        id: String(id),
        title: (body as any).title || 'Updated Title',
      })
    );
  }),

  http.delete('*/agent/conversations/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('*/agent/conversations/:id/messages', () => {
    return HttpResponse.json({
      messages: [
        makeMessage({ id: 'msg-1', role: 'user', content: 'Hello Schedly' }),
        makeMessage({ id: 'msg-2', role: 'assistant', content: 'Hello! How can I help you schedule today?' }),
      ],
      next_cursor: null,
    });
  }),

  http.post('*/agent/chat', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const conversationId = (body as any).conversation_id || 'conv-new-1';
    const content = (body as any).content || 'Hello';
    return HttpResponse.json(
      makeMessage({
        id: `msg-resp-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: `I received your message: "${content}". How else can I assist with your schedule?`,
      })
    );
  }),

  http.get('*/preferences', () => {
    return HttpResponse.json(makePreferences());
  }),

  http.get('*/protected-resource', () => {
    return HttpResponse.json({ data: 'success' });
  }),
];
