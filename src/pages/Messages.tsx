import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: 'pending' | 'read' | 'closed';
  created_at: string;
  message_thread_id: string;
}

interface MessageThread {
  id: string;
  vendor_id: string;
  couple_id: string;
  vendor_name: string;
  vendor_category: string;
  partner1_name: string;
  partner2_name: string;
  last_message_at: string;
  unread_count: number;
  vendor_user_id: string;
  couple_user_id: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel>>();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    checkAuth();
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
      subscribeToMessages();
      if (initialLoad) {
        scrollToBottom();
        setInitialLoad(false);
      }
    }
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [selectedThread]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      loadThreads();
    } else {
      navigate('/auth');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const loadThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('message_thread_details')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      setThreads(data || []);

      if (data?.length && !selectedThread) {
        setSelectedThread(data[0].id);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('message_thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      scrollToBottom();

      // Mark messages as read
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('messages')
          .update({ status: 'read' })
          .eq('message_thread_id', threadId)
          .eq('receiver_id', user.id)
          .eq('status', 'pending');

        await loadThreads(); // Refresh unread counts
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const subscribeToMessages = () => {
    if (!selectedThread) return;

    subscriptionRef.current?.unsubscribe();

    subscriptionRef.current = supabase.channel(`messages:${selectedThread}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `message_thread_id=eq.${selectedThread}` },
        payload => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
          loadThreads(); // Refresh thread list
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const thread = threads.find(t => t.id === selectedThread);
      if (!thread) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: user.id === thread.vendor_user_id ? thread.couple_user_id : thread.vendor_user_id,
          content: newMessage.trim(),
          message_thread_id: selectedThread,
          status: 'pending'
        });

      if (error) throw error;

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] bg-gray-50">
      <div className="max-w-6xl mx-auto h-full">
        <div className="h-full bg-white rounded-lg shadow-sm flex">
          {/* Threads List */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No conversations yet</p>
                </div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setSelectedThread(thread.id);
                      setInitialLoad(true);
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedThread === thread.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {thread.vendor_user_id === currentUserId 
                            ? `${thread.partner1_name} & ${thread.partner2_name}`
                            : thread.vendor_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {thread.vendor_user_id === currentUserId 
                            ? 'Couple'
                            : thread.vendor_category}
                        </p>
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 flex flex-col">
            {selectedThread ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">
                        {threads.find(t => t.id === selectedThread)?.vendor_user_id === currentUserId 
                          ? `${threads.find(t => t.id === selectedThread)?.partner1_name} & ${threads.find(t => t.id === selectedThread)?.partner2_name}`
                          : threads.find(t => t.id === selectedThread)?.vendor_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {threads.find(t => t.id === selectedThread)?.vendor_user_id === currentUserId 
                          ? 'Couple'
                          : threads.find(t => t.id === selectedThread)?.vendor_category}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={containerRef}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender_id === currentUserId
                            ? 'bg-primary text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;