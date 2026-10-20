'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useRequireCalendar } from '@/features/auth/use-auth.hook';
import { useConversations, useSendChatMessage, useCreateConversation } from '@/features/conversations/api/conversations.queries';
import { ChatSidebar } from '@/features/chat/components/chat-sidebar';

export default function NewConversationPage() {
  const router = useRouter();
  const { user, logout, isLoggingOut } = useAuth();
  const { isLoading: isCalendarLoading, isCalendarConnected } = useRequireCalendar();
  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();
  const sendChatMutation = useSendChatMessage();
  const createConvMutation = useCreateConversation();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Close header menu on outside click or touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };
    if (isHeaderMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isHeaderMenuOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await sendChatMutation.mutateAsync({
        content: userMessage,
        conversationId: activeConversationId || undefined,
      });

      if (response && response.conversation_id && !activeConversationId) {
        setActiveConversationId(response.conversation_id);
        router.push(`/c/${response.conversation_id}`);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.content || `I've processed your request. As your Schedly AI scheduling assistant, I'm here to manage your calendar and meetings.`,
        },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the Schedly backend. Please try again.',
        },
      ]);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--color-background)] text-[var(--color-text-primary)] overflow-hidden relative">
      {/* Backdrop overlay when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-15 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Component */}
      <ChatSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentConversationId={activeConversationId}
        conversations={conversations}
        isLoadingConversations={isLoadingConversations}
        user={user}
        logout={logout}
        isLoggingOut={isLoggingOut}
        onNewChat={startNewChat}
      />

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col h-full bg-[var(--color-background)] relative min-w-0">
        {/* Top Header with Chat / + Work Switcher & Controls */}
        <header className="sticky top-0 flex items-center justify-between px-3 md:px-6 py-3 bg-[var(--color-background)]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--color-surface-active)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Open sidebar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-medium text-xs border border-[var(--color-border)]">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between p-4 md:p-6">
          {messages.length === 0 ? (
            /* Empty State / Welcome Screen matching ChatGPT screenshot style */
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center py-10">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-8">
                What&apos;s on the agenda today?
              </h1>

              {/* Centered Chat Input Box */}
              <div className="w-full mb-8">
                <form
                  onSubmit={handleSend}
                  className="relative flex flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-md focus-within:border-[var(--color-text-tertiary)] transition-all"
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask Schedly to schedule, plan, or manage your calendar..."
                    rows={1}
                    className="w-full bg-transparent px-3 py-1.5 text-base text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none resize-none max-h-40"
                  />

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--color-border)]/50">
                    <div className="flex items-center gap-2">
                      {/* Upload and Think buttons removed */}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Voice input"
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-surface-active)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      </button>

                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          input.trim()
                            ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:opacity-90 shadow-sm'
                            : 'bg-[var(--color-surface-active)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                        }`}
                        title="Send message"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5"></line>
                          <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>
          ) : (
            /* Active Conversation View */
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl w-full mx-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] md:max-w-xl shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-br-xs'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sendChatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-xs shadow-sm">
                    <div className="flex items-center gap-1.5 h-5">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Chat Input Bar when conversation is active */}
          {messages.length > 0 && (
            <div className="w-full max-w-3xl mx-auto p-4 pt-6 pb-12">
              <form
                onSubmit={handleSend}
                className="relative flex flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-md focus-within:border-[var(--color-text-tertiary)] transition-all"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask Schedly to schedule, plan, or manage your calendar..."
                  rows={1}
                  className="w-full bg-transparent px-3 py-1.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none resize-none max-h-32"
                />

                <div className="flex items-center justify-between pt-2 mt-1 border-t border-[var(--color-border)]/50">
                  <div className="flex items-center gap-2">
                    {/* Upload and Think buttons removed */}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                        input.trim()
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:opacity-90 shadow-sm'
                          : 'bg-[var(--color-surface-active)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              </form>
              <p className="text-center text-[10px] text-[var(--color-text-tertiary)] mt-2">
                Schedly can make mistakes. Verify important calendar schedules.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
