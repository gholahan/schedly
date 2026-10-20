'use client';

import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useAuth, useRequireCalendar } from '@/features/auth/use-auth.hook';
import {
  useConversations,
  useConversationMessages,
  useSendChatMessage,
  useDeleteConversation,
} from '@/features/conversations/api/conversations.queries';
import { ChatSidebar } from '@/features/chat/components/chat-sidebar';

function formatMessageTime(dateString?: string) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function processBrTags(nodeContent: React.ReactNode): React.ReactNode {
  if (typeof nodeContent === 'string') {
    const parts = nodeContent.split(/<br\s*\/?>/gi);
    if (parts.length > 1) {
      return parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <br />}
        </span>
      ));
    }
    return nodeContent;
  }
  if (Array.isArray(nodeContent)) {
    return nodeContent.map((child, i) => (
      <React.Fragment key={i}>{processBrTags(child)}</React.Fragment>
    ));
  }
  return nodeContent;
}

interface ChatDetailClientProps {
  conversationId: string;
}

export default function ChatDetailClient({ conversationId }: ChatDetailClientProps) {
  const router = useRouter();

  const { user, logout, isLoggingOut } = useAuth();
  const { isLoading: isCalendarLoading, isCalendarConnected } = useRequireCalendar();
  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();
  const { data: messagesData, isLoading: isLoadingMessages } = useConversationMessages(conversationId);
  const sendChatMutation = useSendChatMessage();
  const deleteConvMutation = useDeleteConversation();

  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string; created_at?: string }>>([]);
  const [hoveredMessageIdx, setHoveredMessageIdx] = useState<number | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset or sync messages when conversationId or messagesData changes
  useEffect(() => {
    if (conversationId === 'new') {
      setLocalMessages([]);
    } else if (messagesData?.messages) {
      const formatted = messagesData.messages.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
        created_at: msg.created_at,
      }));
      setLocalMessages(formatted);
    }
  }, [conversationId, messagesData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, sendChatMutation.isPending]);

  // Close header menu on outside click
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
    if (!input.trim() || sendChatMutation.isPending) return;

    setErrorBanner(null);
    const userMessage = input.trim();
    setLocalMessages((prev) => [...prev, { role: 'user', content: userMessage, created_at: new Date().toISOString() }]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await sendChatMutation.mutateAsync({
        content: userMessage,
        conversationId,
      });

      setLocalMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            response.content ||
            `I've processed your request. As your Schedly AI scheduling assistant, I'm here to manage your calendar and meetings.`,
          created_at: response.created_at || new Date().toISOString(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setErrorBanner(
        error?.response?.data?.detail ||
          'Sorry, I encountered an error connecting to the Schedly backend. Please try again.'
      );
    }
  };

  const startNewChat = () => {
    router.push('/c/new');
  };

  const handleDeleteConversation = async () => {
    try {
      await deleteConvMutation.mutateAsync(conversationId);
      router.push('/c/new');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
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
        currentConversationId={conversationId}
        conversations={conversations}
        isLoadingConversations={isLoadingConversations}
        user={user}
        logout={logout}
        isLoggingOut={isLoggingOut}
        onNewChat={startNewChat}
      />

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col h-full bg-[var(--color-background)] relative min-w-0">
        {/* Top Header */}
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
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-surface-active)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors border border-[var(--color-border)]"
                title="Chat Options"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>

              {isHeaderMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl py-1.5 z-30 text-xs text-[var(--color-text-primary)]">
                  <button
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--color-surface-active)] transition-colors text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="17" x2="12" y2="22"></line>
                      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-.89 1.65l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                    </svg>
                    <span>Pin chat</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      startNewChat();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--color-surface-active)] transition-colors text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    <span>New chat</span>
                  </button>
                  <div className="h-[1px] bg-[var(--color-border)] my-1"></div>
                  <button
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--color-surface-active)] transition-colors text-left text-[var(--color-error)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
            <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-medium text-xs border border-[var(--color-border)]">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between p-4 md:p-6">
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs text-[var(--color-text-tertiary)] animate-pulse">
                Loading messages...
              </div>
            </div>
          ) : localMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center py-10">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-8">
                Conversation started
              </h1>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl w-full mx-auto">
              {localMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group relative`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] md:max-w-xl shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-br-xs'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-xs prose prose-invert max-w-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" />
                          ),
                          p: ({ node, children, ...props }) => <p {...props} className="mb-2 last:mb-0">{processBrTags(children)}</p>,
                          ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 mb-2" />,
                          ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 mb-2" />,
                          li: ({ node, ...props }) => <li {...props} className="mb-1" />,
                          strong: ({ node, ...props }) => <strong {...props} className="font-semibold" />,
                          code: ({ node, inline, ...props }: any) =>
                            inline ? (
                              <code {...props} className="bg-[var(--color-surface-active)] px-1 py-0.5 rounded text-xs font-mono" />
                            ) : (
                              <pre className="bg-[var(--color-surface-active)] p-2 rounded-lg my-2 overflow-x-auto text-xs font-mono">
                                <code {...props} />
                              </pre>
                            ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-2 rounded-lg border border-[var(--color-border)]">
                              <table {...props} className="min-w-full divide-y divide-[var(--color-border)] text-left text-xs" />
                            </div>
                          ),
                          thead: ({ node, ...props }) => <thead {...props} className="bg-[var(--color-surface-active)]" />,
                          tbody: ({ node, ...props }) => <tbody {...props} className="divide-y divide-[var(--color-border)]" />,
                          tr: ({ node, ...props }) => <tr {...props} className="hover:bg-[var(--color-surface-active)]/50 transition-colors" />,
                          th: ({ node, ...props }) => <th {...props} className="px-3 py-2 font-semibold text-[var(--color-text-primary)]" />,
                          td: ({ node, children, ...props }) => <td {...props} className="px-3 py-2 align-top text-[var(--color-text-secondary)]">{processBrTags(children)}</td>,
                          h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold mb-2 mt-3" />,
                          h2: ({ node, ...props }) => <h2 {...props} className="text-base font-bold mb-2 mt-3" />,
                          h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-bold mb-1.5 mt-2" />,
                          blockquote: ({ node, ...props }) => <blockquote {...props} className="border-l-2 border-[var(--color-border)] pl-3 italic my-2 text-[var(--color-text-secondary)]" />,
                          hr: ({ node, ...props }) => <hr {...props} className="my-3 border-[var(--color-border)]" />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* Assistant Message Toolbar */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1 px-1 text-[var(--color-text-tertiary)] text-xs">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                        }}
                        className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors p-1 rounded"
                        title="Copy message"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span>Copy</span>
                      </button>
                      <div
                        className="relative"
                        onMouseEnter={() => setHoveredMessageIdx(idx)}
                        onMouseLeave={() => setHoveredMessageIdx(null)}
                      >
                        <button
                          className="hover:text-[var(--color-text-primary)] transition-colors p-1 rounded"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                        </button>
                        {hoveredMessageIdx === idx && (
                          <div className="absolute left-0 bottom-full mb-1 w-44 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl py-1 z-30 text-xs text-[var(--color-text-primary)] animate-in fade-in duration-150">
                            <div className="px-3 py-1.5 text-[11px] text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]/50">
                              {formatMessageTime(msg.created_at)}
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                setHoveredMessageIdx(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-surface-active)] transition-colors flex items-center gap-2"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                              Copy text
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* User timestamp */}
                  {msg.role === 'user' && (
                    <div className="mt-1 px-1 text-[var(--color-text-tertiary)] text-[11px]">
                      {formatMessageTime(msg.created_at)}
                    </div>
                  )}
                </div>
              ))}

              {sendChatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-2xl rounded-bl-xs px-4 py-3 text-sm shadow-sm flex items-center gap-2">
                    <div className="flex space-x-1 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-[var(--color-text-tertiary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-[var(--color-text-tertiary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-[var(--color-text-tertiary)] rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)] ml-1">Schedly is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Area */}
          <div className="max-w-3xl w-full mx-auto pt-4 pb-1">
            {errorBanner && (
              <div className="mb-3 flex items-center justify-between gap-3 bg-[var(--color-surface)] border border-red-500/40 text-red-500 px-4 py-3 rounded-2xl text-xs shadow-md animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>{errorBanner}</span>
                </div>
                <button
                  onClick={() => setErrorBanner(null)}
                  className="hover:opacity-75 transition-opacity p-1"
                  title="Dismiss error"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            <form
              onSubmit={handleSend}
              className="relative flex flex-col rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg focus-within:border-[var(--color-text-secondary)] transition-colors p-3"
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
                placeholder="Ask Schedly to schedule, check calendar..."
                rows={1}
                className="w-full resize-none bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none max-h-40 py-1.5 px-1"
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)]/40">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  {/* <span>Press Enter to send, Shift + Enter for new line</span> */}
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || sendChatMutation.isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  title="Send message"
                >
                  {sendChatMutation.isPending ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            </form>
            <div className="text-center mt-3">
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Schedly can make mistakes. Verify important meeting and calendar times.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-sm w-full p-6 text-[var(--color-text-primary)]">
            <h3 className="text-base font-semibold mb-2">Delete conversation</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--color-surface-active)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConvMutation.isPending}
                onClick={async () => {
                  try {
                    await deleteConvMutation.mutateAsync(conversationId);
                    toast.success('Conversation deleted successfully');
                    router.push('/c/new');
                  } catch (err) {
                    toast.error('Failed to delete conversation');
                    console.error('Failed to delete conversation:', err);
                  } finally {
                    setIsDeleteModalOpen(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteConvMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
