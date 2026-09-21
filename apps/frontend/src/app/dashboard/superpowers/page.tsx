'use client';

import { useQuery, useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Bookmark, Code2, Copy, Hash, Plus, Star, StarOff, Trash2, Zap } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const GET_SUPERPOWERS = gql`
  query GetSuperpowers {
    savedQueries {
      id
      name
      description
      query
      hash
      variables
      isBookmarked
      tags
      createdAt
      updatedAt
    }
    bookmarkedNodes {
      id
      nodeType
      nodeId
      label
      color
      createdAt
    }
  }
`;

const SAVE_QUERY = gql`
  mutation SaveQuery($input: SaveQueryInput!) {
    saveQuery(input: $input) {
      id
      name
      hash
      isBookmarked
    }
  }
`;

const TOGGLE_BOOKMARK_QUERY = gql`
  mutation ToggleQueryBookmark($id: Int!) {
    toggleQueryBookmark(id: $id) {
      id
      isBookmarked
    }
  }
`;

const DELETE_QUERY = gql`
  mutation DeleteQuery($id: Int!) {
    deleteQuery(id: $id)
  }
`;

const REMOVE_BOOKMARK = gql`
  mutation RemoveBookmark($nodeType: String!, $nodeId: Int!) {
    removeBookmark(nodeType: $nodeType, nodeId: $nodeId)
  }
`;

export default function SuperpowersPage() {
  const [activeTab, setActiveTab] = useState<'queries' | 'bookmarks'>('queries');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newQuery, setNewQuery] = useState({ name: '', description: '', query: '', tags: '' });
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_SUPERPOWERS);

  const [saveQuery] = useMutation(SAVE_QUERY, {
    onCompleted: () => {
      setShowSaveForm(false);
      setNewQuery({ name: '', description: '', query: '', tags: '' });
      refetch();
    },
  });

  const [toggleBookmark] = useMutation(TOGGLE_BOOKMARK_QUERY, {
    onCompleted: () => refetch(),
  });

  const [deleteQuery] = useMutation(DELETE_QUERY, {
    onCompleted: () => refetch(),
  });

  const [removeBookmark] = useMutation(REMOVE_BOOKMARK, {
    onCompleted: () => refetch(),
  });

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const savedQueries = data?.savedQueries ?? [];
  const bookmarkedNodes = data?.bookmarkedNodes ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-violet-500" />
            <h1 className="text-2xl font-bold tracking-tight">Superpowers</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Save GraphQL queries (APQ hashes) · Bookmark nodes for quick access
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {(['queries', 'bookmarks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'queries' ? (
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Saved Queries ({savedQueries.length})
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                Bookmarked Nodes ({bookmarkedNodes.length})
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'queries' ? (
          <motion.div
            key="queries"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Save new query button */}
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              Save a new query
            </button>

            {/* Save query form */}
            <AnimatePresence>
              {showSaveForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl border bg-card space-y-3">
                    <h3 className="font-medium text-sm">Save GraphQL Query (APQ)</h3>
                    <input
                      placeholder="Query name *"
                      value={newQuery.name}
                      onChange={(e) => setNewQuery({ ...newQuery, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      placeholder="Description (optional)"
                      value={newQuery.description}
                      onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <textarea
                      placeholder="GraphQL query *"
                      value={newQuery.query}
                      onChange={(e) => setNewQuery({ ...newQuery, query: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <input
                      placeholder="Tags (comma-separated)"
                      value={newQuery.tags}
                      onChange={(e) => setNewQuery({ ...newQuery, tags: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          saveQuery({
                            variables: {
                              input: {
                                name: newQuery.name,
                                description: newQuery.description || undefined,
                                query: newQuery.query,
                                tags: newQuery.tags || undefined,
                              },
                            },
                          })
                        }
                        disabled={!newQuery.name || !newQuery.query}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                      >
                        Save & Generate Hash
                      </button>
                      <button
                        onClick={() => setShowSaveForm(false)}
                        className="px-4 py-2 rounded-lg border text-sm hover:bg-accent transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Saved queries list */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : savedQueries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Code2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No saved queries yet</p>
                <p className="text-xs mt-1">Save a query to generate its APQ hash</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedQueries.map((sq: any, i: number) => (
                  <motion.div
                    key={sq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {sq.isBookmarked && <Star className="w-3.5 h-3.5 text-yellow-500 fill-current flex-shrink-0" />}
                          <h3 className="font-medium text-sm">{sq.name}</h3>
                        </div>
                        {sq.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{sq.description}</p>
                        )}

                        {/* APQ Hash */}
                        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-muted/50 font-mono text-xs">
                          <Hash className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span className="truncate text-muted-foreground">{sq.hash}</span>
                          <button
                            onClick={() => copyHash(sq.hash)}
                            className="ml-auto flex-shrink-0 hover:text-foreground transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {copiedHash === sq.hash && (
                          <p className="text-xs text-emerald-500 mt-1">Copied!</p>
                        )}

                        {/* Query preview */}
                        <pre className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 overflow-x-auto max-h-24">
                          {sq.query}
                        </pre>

                        {sq.tags && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {sq.tags.split(',').map((t: string) => (
                              <span key={t} className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 text-xs">
                                {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Saved {formatRelativeTime(sq.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleBookmark({ variables: { id: sq.id } })}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                          title={sq.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          {sq.isBookmarked ? (
                            <StarOff className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Star className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteQuery({ variables: { id: sq.id } })}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="bookmarks"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : bookmarkedNodes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No bookmarked nodes</p>
                <p className="text-xs mt-1">Bookmark tickets, users, or any node for quick access</p>
              </div>
            ) : (
              bookmarkedNodes.map((node: any, i: number) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ backgroundColor: node.color }}
                  >
                    {node.nodeType[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{node.label || `${node.nodeType} #${node.nodeId}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {node.nodeType} · ID: {node.nodeId} · {formatRelativeTime(node.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeBookmark({ variables: { nodeType: node.nodeType, nodeId: node.nodeId } })}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
