'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateConversationTitle, useDeleteConversation } from '@/features/conversations/api/conversations.queries';
import { toast } from 'sonner';

interface ChatSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentConversationId?: string | null;
  conversations: Array<{ id: string; title?: string }>;
  isLoadingConversations: boolean;
  user: { name?: string; email?: string } | null;
  logout: () => void;
  isLoggingOut: boolean;
  onNewChat: () => void;
}

export function ChatSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  currentConversationId,
  conversations,
  isLoadingConversations,
  user,
  logout,
  isLoggingOut,
  onNewChat,
}: ChatSidebarProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [activeMenuConvId, setActiveMenuConvId] = useState<string | null>(null);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [updatingConvId, setUpdatingConvId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ id: string; title?: string } | null>(null);

  const updateTitleMutation = useUpdateConversationTitle();
  const deleteConversationMutation = useDeleteConversation();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('schedly_pinned_conversations');
      if (saved) {
        setPinnedIds(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Close user menu on outside click or touch
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (activeMenuConvId && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuConvId(null);
      }
    };
    if (isUserMenuOpen || activeMenuConvId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isUserMenuOpen, activeMenuConvId]);

  const togglePin = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (pinnedIds.includes(convId)) {
      updated = pinnedIds.filter(id => id !== convId);
    } else {
      updated = [...pinnedIds, convId];
    }
    setPinnedIds(updated);
    try {
      localStorage.setItem('schedly_pinned_conversations', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setActiveMenuConvId(null);
  };

  const handleStartRename = (conv: { id: string; title?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingConvId(conv.id);
    setRenameTitle(conv.title || '');
    setActiveMenuConvId(null);
  };

  const handleSaveRename = async (convId: string) => {
    if (renamingConvId !== convId) return;
    const titleToSave = renameTitle.trim();
    setRenamingConvId(null);
    if (!titleToSave) return;

    setUpdatingConvId(convId);
    try {
      await updateTitleMutation.mutateAsync({ conversationId: convId, title: titleToSave });
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    } finally {
      setUpdatingConvId(null);
    }
  };

  const handleDeleteClick = (conv: { id: string; title?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuConvId(null);
    setConversationToDelete(conv);
    setIsDeleteModalOpen(true);
  };

  const pinnedConversations = conversations.filter(c => pinnedIds.includes(c.id));
  const recentConversations = conversations.filter(c => !pinnedIds.includes(c.id));

  const renderConversationItem = (conv: { id: string; title?: string }) => {
    const isPinned = pinnedIds.includes(conv.id);
    const isMenuOpen = activeMenuConvId === conv.id;
    const isRenaming = renamingConvId === conv.id;

    return (
      <div
        key={conv.id}
        onClick={() => {
          if (isRenaming) return;
          setIsSidebarOpen(false);
          router.push(`/c/${conv.id}`);
        }}
        className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-colors ${
          currentConversationId === conv.id
            ? 'bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-medium'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        {isRenaming ? (
          <input
            type="text"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(conv.id);
              if (e.key === 'Escape') setRenamingConvId(null);
            }}
            onBlur={() => handleSaveRename(conv.id)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-[var(--color-background)] border border-[var(--color-success)] rounded px-1.5 py-0.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
          />
        ) : (
          <>
            <div className="flex items-center gap-2 truncate flex-1 pr-6">
              {isPinned && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="shrink-0 text-[var(--color-success)]">
                  <path d="M12 2a1 1 0 0 1 .993.883L13 3v4.586l3.707 3.707a1 1 0 0 1 .293.707V13a1 1 0 0 1-1 1h-4v7a1 1 0 0 1-2 0v-7H6a1 1 0 0 1-1-1v-1.008a1 1 0 0 1 .293-.707L9 7.586V3a1 1 0 0 1 1-1z"></path>
                </svg>
              )}
              <span className="truncate">{conv.title || 'Untitled conversation'}</span>
            </div>

            {/* Three dots button or spinner */}
            <div className="absolute right-1.5 flex items-center">
              {updatingConvId === conv.id ? (
                <div className="p-1">
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--color-text-secondary)]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuConvId(isMenuOpen ? null : conv.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-opacity ${
                    isMenuOpen ? 'opacity-100 bg-[var(--color-surface-hover)]' : ''
                  }`}
                  title="Options"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="12" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                  </svg>
                </button>
              )}

              {/* Popup Menu */}
              {isMenuOpen && updatingConvId !== conv.id && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => togglePin(conv.id, e)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="17" x2="12" y2="22"></line>
                      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                    </svg>
                    <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleStartRename(conv, e)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                    <span>Rename</span>
                  </button>

                  <div className="my-1 border-t border-[var(--color-border)]/50"></div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(conv, e)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--color-error)] hover:bg-[var(--color-surface-active)] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <aside
      onTouchStart={(e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = e.targetTouches[0].clientX;
      }}
      onTouchMove={(e) => {
        touchEndX.current = e.targetTouches[0].clientX;
      }}
      onTouchEnd={() => {
        if (touchStartX.current - touchEndX.current > 50) {
          setIsSidebarOpen(false);
        }
      }}
      className={`flex flex-col w-64 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] transition-all duration-300 ease-in-out z-20 shrink-0 absolute md:relative h-full ${
        isSidebarOpen
          ? 'translate-x-0 opacity-100 shadow-lg md:shadow-none'
          : '-translate-x-full md:-ml-64 opacity-0 md:opacity-100'
      }`}
    >
      <div className="flex flex-col h-full w-64">
        {/* Top Sidebar Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]/50 shrink-0">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold text-xs shadow-sm">
              S
            </div>
            <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">Schedly</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--color-surface-active)] text-[var(--color-text-secondary)] transition-colors"
            title="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
        </div>

        {/* Action Buttons: New Chat & Search */}
        <div className="p-3 space-y-1.5 border-b border-[var(--color-border)]/50 shrink-0">
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              onNewChat();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-active)] transition-colors"
            title="New Chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span className="truncate">New chat</span>
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)] hover:text-[var(--color-text-primary)] transition-colors"
            title="Search chats"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span className="truncate">Search chats</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {isLoadingConversations ? (
            <div className="px-2 py-3 text-xs text-[var(--color-text-tertiary)] animate-pulse">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-2 py-3 text-xs text-[var(--color-text-tertiary)]">
              No recent conversations
            </div>
          ) : (
            <>
              {pinnedConversations.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider">
                    Pinned
                  </div>
                  {pinnedConversations.map((conv) => renderConversationItem(conv))}
                </div>
              )}

              <div className="space-y-1">
                {pinnedConversations.length > 0 && (
                  <div className="px-2 py-1.5 text-[11px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider">
                    Recent
                  </div>
                )}
                {recentConversations.map((conv) => renderConversationItem(conv))}
              </div>
            </>
          )}
        </div>

        {/* User Profile Footer */}
        <div className="relative border-t border-[var(--color-border)]/50 p-3 flex items-center justify-between shrink-0" ref={userMenuRef}>
          {/* User Popup Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl py-1.5 z-30 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-3 py-2 border-b border-[var(--color-border)]/50">
                <p className="font-medium text-[var(--color-text-primary)] truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">{user?.email || ''}</p>
              </div>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  router.push('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Settings
              </button>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  router.push('/settings?tab=account');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Profile
              </button>
              <div className="my-1 border-t border-[var(--color-border)]/50"></div>
              <button
                onClick={() => { logout(); }}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[var(--color-error)] hover:bg-[var(--color-surface-active)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <svg className="animate-spin h-3.5 w-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                )}
                <span>Log out</span>
              </button>
            </div>
          )}

          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 truncate cursor-pointer flex-1 py-1 px-1 rounded-lg hover:bg-[var(--color-surface-active)] transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-bold text-xs border border-[var(--color-border)]">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium truncate text-[var(--color-text-primary)]">{user?.name || user?.email || 'User'}</p>
              <p className="text-[10px] text-[var(--color-success)] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] inline-block"></span>
                Connected
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[var(--color-surface-active)] text-[var(--color-text-secondary)] transition-colors"
            title="User menu"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && conversationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-sm w-full p-6 text-[var(--color-text-primary)]">
            <h3 className="text-base font-semibold mb-2">Delete conversation</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-6">
              Are you sure you want to delete &quot;{conversationToDelete.title || 'Untitled conversation'}&quot;? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConversationToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--color-surface-active)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConversationMutation.isPending}
                onClick={async () => {
                  try {
                    await deleteConversationMutation.mutateAsync(conversationToDelete.id);
                    toast.success('Conversation deleted successfully');
                    if (currentConversationId === conversationToDelete.id) {
                      router.push('/c/new');
                    }
                  } catch (err) {
                    toast.error('Failed to delete conversation');
                    console.error('Failed to delete conversation:', err);
                  } finally {
                    setIsDeleteModalOpen(false);
                    setConversationToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteConversationMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
