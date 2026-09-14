import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';

export default function Inbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          listings (id, title, price, images),
          buyer:profiles!conversations_buyer_id_fkey(id, full_name),
          seller:profiles!conversations_seller_id_fkey(id, full_name)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (!error) setConversations(data || []);
      setLoading(false);
    };

    fetchConversations();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20 text-slate-400">
        Please sign in to access your inbox.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Messages & Offers</h1>
        <p className="text-sm text-slate-400">Chat with campus buyers and sellers</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading chats...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
          <MessageSquare className="mx-auto text-slate-600 mb-3" size={32} />
          <p className="text-slate-400 text-sm">No conversations yet.</p>
          <p className="text-xs text-slate-500 mt-1">Browse items and click "Message Seller" to start one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((convo) => {
            const isSeller = convo.seller?.id === user.id;
            const counterpartName = isSeller ? convo.buyer?.full_name : convo.seller?.full_name;
            const itemImage = convo.listings?.images?.[0] || 'https://via.placeholder.com/150';

            return (
              <div
                key={convo.id}
                onClick={() => navigate(`/chat/${convo.id}`)}
                className="flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={itemImage}
                    alt="item"
                    className="w-14 h-14 object-cover rounded-lg bg-slate-800 border border-slate-800"
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      {convo.listings?.title || 'Unknown Item'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isSeller ? `Buyer: ${counterpartName}` : `Seller: ${counterpartName}`}
                    </p>
                    <span className="inline-block mt-1 text-xs font-semibold text-indigo-400">
                      ₹{convo.listings?.price}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-slate-500 group-hover:text-white transition">
                  <span className="text-xs">
                    {new Date(convo.updated_at).toLocaleDateString()}
                  </span>
                  <ArrowRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}