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
  const { communityPosts, toggleLikePost, toggleBookmarkPost, addCommunityPost, setToastMessage } = useKitchen();
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
    <div className="space-y-6 pb-24 relative">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1c2529] border border-white/10">
        <div>
          <span className="text-xs font-bold text-[#a1e3f9] uppercase tracking-wider">Home Cook Network</span>
          <h2 className="font-display text-xl font-bold text-white mt-0.5">Community Tips & Ideas</h2>
          <p className="text-xs text-[#8e989b]">Real cooking tips, food storage hacks, and leftover recipes from home cooks</p>
        </div>

        <button
          onClick={() => setShowPostModal(true)}
          className="px-4 py-2 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Share Kitchen Tip</span>
        </button>
      </div>

      {/* 2. Search & Category Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8e989b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search kitchen tips, broth recipes, croutons, leftover ideas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs placeholder-[#5a6568] focus:border-[#a1e3f9] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#a1e3f9] text-[#003642] font-bold shadow-sm'
                  : 'bg-[#1c2529] text-[#bfc8cc] hover:text-white border border-white/5'
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
            className="rounded-2xl bg-[#1c2529] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all group"
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c2529] via-transparent to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#1c2529]/90 text-[#a1e3f9] border border-[#a1e3f9]/30 backdrop-blur-md">
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
                    className="w-8 h-8 rounded-full object-cover border border-white/15"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-white">{post.author}</h4>
                    <p className="text-[10px] text-[#8e989b]">{post.category} contributor</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-base font-bold text-white group-hover:text-[#a1e3f9] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#bfc8cc] leading-relaxed mt-1">{post.description}</p>
                </div>
              </div>
            </div>

            {/* Interactions Footer */}
            <div className="p-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#8e989b]">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLikePost(post.id)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    post.liked ? 'text-rose-400 font-bold' : 'hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-current text-rose-400' : ''}`} />
                  <span className="font-mono text-[11px]">{post.likes}</span>
                </button>

                <button
                  onClick={() => setToastMessage(`Viewing ${post.comments} comments on "${post.title}"`)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-mono text-[11px]">{post.comments}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmarkPost(post.id)}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
                    post.bookmarked ? 'text-[#a1e3f9]' : 'hover:text-white'
                  }`}
                  title={post.bookmarked ? 'Remove bookmark' : 'Bookmark tip'}
                >
                  <Bookmark className={`w-4 h-4 ${post.bookmarked ? 'fill-current text-[#a1e3f9]' : ''}`} />
                </button>
                <button
                  onClick={() => setToastMessage(`Copied share link for "${post.title}"`)}
                  className="p-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
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
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] shadow-xl shadow-[#a1e3f9]/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-30 cursor-pointer"
        title="Share Kitchen Tip"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Share Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#1c2529] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-white">Share a Kitchen Tip or Recipe</h3>
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs text-[#8e989b] mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Herb Butter from Leftover Herbs"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#151d20] border border-white/10 text-xs text-white outline-none focus:border-[#a1e3f9]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8e989b] mb-1">Your Tip or Instructions</label>
                <textarea
                  rows={3}
                  placeholder="How did you use or save the ingredient?"
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#151d20] border border-white/10 text-xs text-white outline-none focus:border-[#a1e3f9]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#8e989b] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#a1e3f9] text-[#003642] text-xs font-bold cursor-pointer hover:bg-[#c2effc] transition-all"
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
