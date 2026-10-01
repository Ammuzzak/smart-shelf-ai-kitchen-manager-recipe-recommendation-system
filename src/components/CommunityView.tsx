import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Plus,
  Search,
  Share2,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const CommunityView: React.FC = () => {
  const { communityPosts, toggleLikePost, toggleBookmarkPost, addCommunityPost, setToastMessage, theme } = useKitchen();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'All' | 'Recipes' | 'Tips' | 'Stories'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');

  const filterTabs = ['All', 'Recipes', 'Tips', 'Stories'] as const;

  const filteredPosts = communityPosts.filter((post) => {
    const matchesTab = activeTab === 'All' || post.category === activeTab;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;
    addCommunityPost({
      title: postTitle.trim(),
      description: postDesc.trim() || 'A simple kitchen tip shared with the community.',
      badge: 'Kitchen Tip',
      category: activeTab === 'All' ? 'Tips' : activeTab,
    });
    setShowPostModal(false);
    setPostTitle('');
    setPostDesc('');
  };

  return (
    <div className={`space-y-6 pb-24 relative theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* 1. Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
          }`}>
            Home Cook Network
          </span>
          <h2 className={`font-display text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            Community Tips & Ideas
          </h2>
          <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Real cooking tips, food storage hacks, and leftover recipes from home cooks
          </p>
        </div>

        <button
          onClick={() => setShowPostModal(true)}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
            isDark
              ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
              : 'bg-[#557A62] hover:bg-[#43634F] text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Share Kitchen Tip</span>
        </button>
      </div>

      {/* 2. Search & Category Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
            isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search kitchen tips, broth recipes, croutons, leftover ideas..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
              isDark
                ? 'bg-[#151d20] border-white/10 text-white placeholder-[#5a6568] focus:border-[#a1e3f9]'
                : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#8A9590] focus:border-[#6FAF8F]'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === tab
                  ? isDark
                    ? 'bg-[#a1e3f9] text-[#003642] font-bold shadow-sm'
                    : 'bg-[#557A62] text-white font-bold shadow-sm'
                  : isDark
                  ? 'bg-[#1c2529] text-[#bfc8cc] hover:text-white border border-white/5'
                  : 'bg-[#FFFFFF] text-[#68736D] hover:text-[#24332D] border border-[#E4DED2]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Community Feed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all group shadow-sm ${
              isDark
                ? 'bg-[#1c2529] border-white/10 hover:border-white/20'
                : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#6FAF8F]/40'
            }`}
          >
            <div>
              {/* Image with Tag badge */}
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 ${
                  isDark
                    ? 'bg-gradient-to-t from-[#1c2529] via-transparent to-transparent'
                    : 'bg-gradient-to-t from-black/50 via-transparent to-transparent'
                }`} />

                <div className="absolute top-3 left-3">
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${
                    isDark
                      ? 'bg-[#1c2529]/90 text-[#a1e3f9] border-[#a1e3f9]/30'
                      : 'bg-[#FFFFFF]/90 text-[#557A62] border-[#6FAF8F]/30'
                  }`}>
                    {post.badge}
                  </span>
                </div>
              </div>

              {/* Author & Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    referrerPolicy="no-referrer"
                    className={`w-8 h-8 rounded-full object-cover border ${isDark ? 'border-white/15' : 'border-[#E4DED2]'}`}
                  />
                  <div>
                    <h4 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>{post.author}</h4>
                    <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>{post.category} contributor</p>
                  </div>
                </div>

                <div>
                  <h3 className={`font-display text-base font-bold transition-colors ${
                    isDark ? 'text-white group-hover:text-[#a1e3f9]' : 'text-[#24332D] group-hover:text-[#557A62]'
                  }`}>
                    {post.title}
                  </h3>
                  <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>{post.description}</p>
                </div>
              </div>
            </div>

            {/* Interactions Footer */}
            <div className={`p-4 pt-3 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-white/5 text-[#8e989b]' : 'border-[#E4DED2] text-[#68736D]'
            }`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLikePost(post.id)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    post.liked
                      ? 'text-rose-400 font-bold'
                      : isDark ? 'hover:text-white' : 'hover:text-[#24332D]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-current text-rose-400' : ''}`} />
                  <span className="font-mono text-[11px]">{post.likes}</span>
                </button>

                <button
                  onClick={() => setToastMessage(`Viewing ${post.comments} comments on "${post.title}"`)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDark ? 'hover:text-white' : 'hover:text-[#24332D]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-mono text-[11px]">{post.comments}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmarkPost(post.id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    post.bookmarked
                      ? isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
                      : isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-[#24332D] hover:bg-[#F7F5EF]'
                  }`}
                  title={post.bookmarked ? 'Remove bookmark' : 'Bookmark tip'}
                >
                  <Bookmark className={`w-4 h-4 ${
                    post.bookmarked
                      ? isDark ? 'fill-current text-[#a1e3f9]' : 'fill-current text-[#557A62]'
                      : ''
                  }`} />
                </button>
                <button
                  onClick={() => setToastMessage(`Copied share link for "${post.title}"`)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'hover:text-white hover:bg-white/5' : 'hover:text-[#24332D] hover:bg-[#F7F5EF]'
                  }`}
                  title="Share tip"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button (+) */}
      <button
        onClick={() => setShowPostModal(true)}
        className={`fixed bottom-20 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-30 cursor-pointer shadow-lg ${
          isDark
            ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] shadow-[#a1e3f9]/30'
            : 'bg-[#557A62] hover:bg-[#43634F] text-white shadow-[#557A62]/30'
        }`}
        title="Share Kitchen Tip"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Share Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-2xl p-6 space-y-4 shadow-xl ${
            isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
          }`}>
            <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Share a Kitchen Tip or Recipe
            </h3>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Herb Butter from Leftover Herbs"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark
                      ? 'bg-[#151d20] border-white/10 text-white focus:border-[#a1e3f9]'
                      : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] focus:border-[#6FAF8F]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Your Tip or Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="How did you use or save the ingredient?"
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark
                      ? 'bg-[#151d20] border-white/10 text-white focus:border-[#a1e3f9]'
                      : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] focus:border-[#6FAF8F]'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer ${
                    isDark ? 'text-[#8e989b] hover:text-white' : 'text-[#68736D] hover:text-[#24332D]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    isDark
                      ? 'bg-[#a1e3f9] text-[#003642] hover:bg-[#c2effc]'
                      : 'bg-[#557A62] text-white hover:bg-[#43634F]'
                  }`}
                >
                  Publish Tip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
