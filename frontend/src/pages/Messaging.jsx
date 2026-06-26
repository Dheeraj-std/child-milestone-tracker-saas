import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMessageContacts,
  getMessageThread,
  sendMessage,
  getAdminMonitorMessages,
} from "../services/studentService";
import { toast } from "react-hot-toast";

const Messaging = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' or 'monitor' (for Admin)
  const [monitorMessages, setMonitorMessages] = useState([]);
  const [loadingMonitor, setLoadingMonitor] = useState(false);

  const messagesEndRef = useRef(null);

  // Load contacts
  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await getMessageContacts();
      if (res.success) {
        setContacts(res.contacts || []);
        if (res.contacts && res.contacts.length > 0) {
          setSelectedContact(res.contacts[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contacts.");
    } finally {
      setLoadingContacts(false);
    }
  };

  // Load message thread for the selected contact
  const loadMessages = async (contactId) => {
    if (!contactId) return;
    try {
      const res = await getMessageThread(contactId);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load all system messages for admin monitor
  const loadMonitorMessages = async () => {
    try {
      setLoadingMonitor(true);
      const res = await getAdminMonitorMessages();
      if (res.success) {
        setMonitorMessages(res.messages || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load message log.");
    } finally {
      setLoadingMonitor(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Poll for new messages every 5 seconds if a contact is selected
  useEffect(() => {
    if (!selectedContact || activeTab !== "chat") return;
    loadMessages(selectedContact.id);

    const interval = setInterval(() => {
      loadMessages(selectedContact.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedContact, activeTab]);

  // Poll for monitor logs if in monitor tab
  useEffect(() => {
    if (activeTab !== "monitor" || user.role !== "ADMIN") return;
    loadMonitorMessages();

    const interval = setInterval(() => {
      loadMonitorMessages();
    }, 8000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    setSending(true);
    try {
      const res = await sendMessage({
        receiverId: selectedContact.id,
        content: newMessage.trim(),
      });
      if (res.success) {
        setMessages((prev) => [...prev, res.message]);
        setNewMessage("");
      } else {
        toast.error(res.message || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "TEACHER":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      case "PARENT":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/40 to-indigo-950/30 border border-purple-500/20 rounded-3xl p-6 md:p-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
              Communication Center
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
              Messages Hub
            </h1>
            <p className="text-slate-300 text-xs mt-1.5 leading-relaxed max-w-xl">
              Connect directly with parents, teachers, or administrators. Keep track of discussions, announcements, and inquiries.
            </p>
          </div>

          {user.role === "ADMIN" && (
            <div className="flex bg-slate-950/80 border border-slate-800 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                💬 Direct Chat
              </button>
              <button
                onClick={() => setActiveTab("monitor")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "monitor"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🛡️ System Audit Logs
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === "chat" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contacts List Column */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col h-[600px]">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white mb-1">Conversations</h2>
              <p className="text-slate-450 text-[10px]">Select a contact to begin chatting</p>
            </div>

            {loadingContacts ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-purple-500 animate-spin"></div>
                <p className="mt-2 text-slate-500 text-[10px]">Loading contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <svg className="w-10 h-10 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                </svg>
                <p className="text-slate-500 text-xs italic">No contacts found.</p>
                <p className="text-slate-600 text-[10px] mt-1">Parents must be linked to a classroom to chat with their teacher.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {contacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? "bg-purple-950/20 border-purple-500/40 shadow-inner"
                          : "bg-slate-950/20 border-slate-850 hover:bg-slate-900/30 hover:border-slate-800"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center font-bold text-xs text-purple-400">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-white text-xs font-bold truncate leading-tight">
                            {contact.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${getRoleColor(contact.role)}`}>
                            {contact.role}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Window Column */}
          <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl shadow-xl flex flex-col h-[600px] overflow-hidden">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="bg-slate-950/40 border-b border-slate-850 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center font-bold text-sm text-purple-400">
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white text-xs font-bold leading-tight">{selectedContact.name}</h3>
                      <p className="text-slate-400 text-[10px] flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Active Session • {selectedContact.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => loadMessages(selectedContact.id)}
                    className="p-2 text-slate-450 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
                    title="Refresh Chat"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17"></path>
                    </svg>
                  </button>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                      <svg className="w-8 h-8 mb-2 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <p className="text-xs italic">No messages in this conversation yet.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Send a message to start the thread.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === user.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
                        >
                          {!isMe && (
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] text-purple-400 flex items-center justify-center font-bold shrink-0">
                              {selectedContact.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                              isMe
                                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-br-none"
                                : "bg-slate-800 border border-slate-750 text-slate-200 rounded-bl-none"
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                            <span className="block text-[8px] text-slate-350 text-right mt-1.5">
                              {new Date(m.createdAt).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Footer/Input Form */}
                <form
                  onSubmit={handleSend}
                  className="bg-slate-950/40 border-t border-slate-850 p-4 flex gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 placeholder:text-slate-600 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all font-bold text-xs cursor-pointer flex items-center justify-center aspect-square"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
                <svg className="w-12 h-12 mb-3 text-slate-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <h3 className="text-white font-bold text-sm">No Active Chat</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-sm text-center">
                  Select a parent or teacher from the list to view history and start real-time messaging.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Admin Monitor Tab
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Administrative Monitoring</h2>
              <p className="text-slate-400 text-[10px]">Audit logs for all peer-to-peer parent-teacher messages in the system.</p>
            </div>
            <button
              onClick={loadMonitorMessages}
              disabled={loadingMonitor}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              {loadingMonitor ? "Refreshing..." : "🔄 Refresh Log"}
            </button>
          </div>

          {loadingMonitor && monitorMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-purple-500 animate-spin"></div>
              <p className="mt-2 text-slate-500 text-[10px]">Loading audit records...</p>
            </div>
          ) : monitorMessages.length === 0 ? (
            <p className="text-slate-500 text-xs italic py-8 text-center">No system messages logged.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 pr-4">Time</th>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Receiver</th>
                    <th className="py-3 pl-4">Content</th>
                  </tr>
                </thead>
                <tbody>
                  {monitorMessages.map((m) => (
                    <tr key={m.id} className="border-b border-slate-850 hover:bg-slate-950/20 transition-all">
                      <td className="py-3 pr-4 text-[10px] text-slate-500 font-mono">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{m.sender?.name}</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${getRoleColor(m.sender?.role)}`}>
                          {m.sender?.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{m.receiver?.name}</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${getRoleColor(m.receiver?.role)}`}>
                          {m.receiver?.role}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-slate-300 max-w-xs truncate" title={m.content}>
                        {m.content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Messaging;
