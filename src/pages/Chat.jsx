import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { analyzeMessageSafety } from '../lib/gemini';
import { Send, ArrowLeft, ExternalLink, ShieldCheck, Tag, AlertTriangle } from 'lucide-react';

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [safetyWarning, setSafetyWarning] = useState(null);
  const messagesEndRef = useRef(null);

  // Background check for safety sentinel
  const checkSafety = async (text) => {
    if (!text || text.length < 5) return;
    try {
      const analysis = await analyzeMessageSafety(text);
      if (analysis && analysis.isRisky) {
        setSafetyWarning(analysis.advice);
      }
    } catch (err) {
      console.error('Safety Sentinel check failed:', err);
    }
  };

  // 1. Fetch conversation details (with linked listing & profiles)
  useEffect(() => {
    async function loadChatContext() {
      setLoading(true);
      try {
        const { data: convoData, error: convoErr } = await supabase
          .from('conversations')
          .select(`
            id,
            listing_id,
            buyer_id,
            seller_id,
            listings (
              id,
              title,
              price,
              images,
              category,
              status,
              location
            ),
            buyer:profiles!conversations_buyer_id_fkey(id, full_name),
            seller:profiles!conversations_seller_id_fkey(id, full_name)
          `)
          .eq('id', conversationId)
          .maybeSingle();

        if (convoErr) throw convoErr;
        setConversation(convoData);

        // Fetch message history
        const { data: msgData, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (msgErr) throw msgErr;
        setMessages(msgData || []);

        // Optional: Run safety scan on the most recent message
        if (msgData && msgData.length > 0) {
          const lastMsg = msgData[msgData.length - 1];
          checkSafety(lastMsg.content);
        }
      } catch (err) {
        console.error('Chat load error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (conversationId) {
      loadChatContext();
    }

    // 2. Real-time subscription to incoming messages
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          checkSafety(payload.new.content);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const text = newMessage;
    setNewMessage('');

    // Insert message into Supabase
    const { error: sendError } = await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: user.id,
        content: text,
      },
    ]);

    if (!sendError) {
      // Update conversation updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Check the outgoing message through the sentinel
      checkSafety(text);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-3">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Connecting to chat...</span>
      </div>
    );
  }

  const listing = conversation?.listings;
  const isSeller = conversation?.seller_id === user?.id;
  const counterpartName = isSeller
    ? conversation?.buyer?.full_name || 'Buyer'
    : conversation?.seller?.full_name || 'Seller';

  const isSold = listing?.status === 'sold';

  return (
    <div className="max-w-3xl mx-auto h-[82vh] flex flex-col bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Top Bar: Back button + Chat partner info */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/inbox')}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Back to Inbox"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-white leading-tight">{counterpartName}</h2>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              {isSeller ? 'Prospective Buyer' : 'Verified Student'}
            </span>
          </div>
        </div>

        {listing && (
          <Link
            to={`/listing/${listing.id}`}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium hover:underline bg-indigo-950/40 border border-indigo-900/60 px-2.5 py-1 rounded-lg transition"
          >
            <span>View Listing</span>
            <ExternalLink size={13} />
          </Link>
        )}
      </div>

      {/* Direct Listing Product Banner */}
      {listing && (
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 overflow-hidden">
            <img
              src={listing.images?.[0] || 'https://via.placeholder.com/150'}
              alt={listing.title}
              className={`w-11 h-11 rounded-lg object-cover bg-slate-800 border border-slate-800 shrink-0 ${
                isSold ? 'grayscale' : ''
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-white truncate">{listing.title}</p>
                {isSold && (
                  <span className="text-[10px] bg-red-950/80 border border-red-800 text-red-400 px-1.5 py-0.2 rounded font-bold uppercase">
                    Sold
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-indigo-400">₹{listing.price}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5">
                  <Tag size={10} /> {listing.category}
                </span>
                {listing.location && (
                  <>
                    <span>•</span>
                    <span className="truncate">{listing.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Link
            to={`/listing/${listing.id}`}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition shrink-0"
          >
            {isSold ? 'Reviews / Details' : 'Details'}
          </Link>
        </div>
      )}

      {/* Safety Sentinel Warning Banner */}
      {safetyWarning && (
        <div className="px-4 py-2 bg-amber-950/60 border-b border-amber-800/80 flex items-center justify-between gap-2 text-amber-200 text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <span>{safetyWarning}</span>
          </div>
          <button
            onClick={() => setSafetyWarning(null)}
            className="text-amber-400 hover:text-amber-100 font-bold px-1.5 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/30">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">
            No messages yet. Agree on a meetup spot (e.g., SAC, Central Library) to complete the deal!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  <p>{msg.content}</p>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isMe ? 'text-indigo-200/70' : 'text-slate-500'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Propose a campus meetup place or ask about the item..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white p-2.5 rounded-xl transition flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}