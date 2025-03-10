import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Calendar, ArrowRight, Archive, RefreshCw, MessageSquare, BookOpen, Store } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';

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

const VendorMessages = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("🚀 Checking Vendor Access...");
    checkVendorAccess().catch(err => console.error("❌ Error in checkVendorAccess:", err));
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
      scrollToBottom();
    }
  }, [selectedThread]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const checkVendorAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'vendor') {
        toast.error('Unauthorized: Vendor access only');
        navigate('/dashboard');
        return;
      }

      await loadThreads();
    } catch (error) {
      console.error('Error checking vendor access:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadThreads = async () => {
    try {
      const { data: threads, error } = await supabase
        .from('message_thread_details')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setThreads(threads || []);

      if (threads?.length && !selectedThread) {
        setSelectedThread(threads[0].id);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Failed to load messages');
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const { data: messages, error } = await supabase
        .rpc('get_thread_messages', { thread_id: threadId });

      if (error) throw error;
      setMessages(messages || []);
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

  const handleArchiveThread = async (threadId: string) => {
    if (!threadId || archiving) return;
    
    try {
      setArchiving(true);

      const { error } = await supabase
        .from('messages')
        .update({ status: 'closed' })
        .eq('message_thread_id', threadId);

      if (error) throw error;

      setThreads(prev => prev.filter(t => t.id !== threadId));
      setSelectedThread(null);
      setMessages([]);

      toast.success('Conversation archived successfully');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive conversation');
    } finally {
      setArchiving(false);
    }
  };

  const handleUnarchiveThread = async (threadId: string) => {
    if (!threadId || archiving) return;
    
    try {
      setArchiving(true);

      const { error } = await supabase
        .from('messages')
        .update({ 
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('message_thread_id', threadId);

      if (error) throw error;

      setThreads(prev => prev.filter(t => t.id !== threadId));
      setSelectedThread(null);
      setMessages([]);

      toast.success('Conversation unarchived successfully');
      
      await loadThreads();
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      toast.error('Failed to unarchive conversation');
    } finally {
      setArchiving(false);
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
        <BackToDashboard />
        <div className="h-full bg-white rounded-lg shadow-sm flex">
          {/* Threads List */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowArchived(!showArchived);
                  setSelectedThread(null);
                  loadThreads();
                }}
              >
                {showArchived ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Active
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 mr-2" />
                    Archived
                  </>
                )}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {showArchived ? 'No archived conversations' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedThread === thread.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {thread.partner1_name} & {thread.partner2_name}
                        </h3>
                        <p className="text-sm text-gray-600">Couple</p>
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
                        {threads.find(t => t.id === selectedThread)?.partner1_name} & {threads.find(t => t.id === selectedThread)?.partner2_name}
                      </h3>
                      <p className="text-sm text-gray-600">Couple</p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const thread = threads.find(t => t.id === selectedThread);
                          if (thread) {
                            navigate(`/vendor/leads?couple=${thread.couple_id}`);
                          }
                        }}
                      >
                        <Store className="w-4 h-4 mr-2" />
                        Wedding Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const thread = threads.find(t => t.id === selectedThread);
                          if (thread) {
                            navigate(`/calendar/new?couple=${thread.couple_id}&type=Wedding`);
                          }
                        }}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Book Wedding
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const thread = threads.find(t => t.id === selectedThread);
                          if (thread) {
                            navigate(`/calendar/new?couple=${thread.couple_id}`);
                          }
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Consultation
                      </Button>
                      {showArchived ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnarchiveThread(selectedThread)}
                          disabled={archiving}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Unarchive
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleArchiveThread(selectedThread)}
                          disabled={archiving}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={containerRef}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === threads.find(t => t.id === selectedThread)?.vendor_user_id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender_id === threads.find(t => t.id === selectedThread)?.vendor_user_id
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

                {!showArchived && (
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
                )}
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

export default VendorMessages;