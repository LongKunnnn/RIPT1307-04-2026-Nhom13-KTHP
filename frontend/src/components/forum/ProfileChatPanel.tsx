import { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Empty,
  Input,
  Spin,
  Typography,
  message as antMessage,
} from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import type { ChatMessage, ChatUser } from "@/types";
import { chatService } from "@/services/chat/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { formatViDate } from "@/utils/format";

const { Text, Title } = Typography;

interface ProfileChatPanelProps {
  targetUser: ChatUser;
}

export function ProfileChatPanel({ targetUser }: ProfileChatPanelProps) {
  const { user, isAuthenticated } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChat = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    try {
      const conv = await chatService.getOrCreateConversation(targetUser.id);
      setConversationId(conv.id);
      const msgs = await chatService.getMessages(conv.id);
      setMessages(msgs);
    } catch {
      antMessage.error("Không thể tải cuộc trò chuyện.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, targetUser.id]);

  useEffect(() => {
    void loadChat();
  }, [loadChat]);

  const handleSend = async () => {
    if (!messageInput.trim() || !conversationId || !user) return;
    setSending(true);
    try {
      const sent = await chatService.sendMessage(conversationId, messageInput);
      setMessages((prev) => [...prev, sent]);
      setMessageInput("");
    } catch {
      antMessage.error("Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Empty
        description="Đăng nhập để nhắn tin với thành viên này"
        style={{ padding: 48 }}
      />
    );
  }

  if (user?.id === targetUser.id) {
    return (
      <Empty
        description="Bạn không thể nhắn tin với chính mình"
        style={{ padding: 48 }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="profile-chat-panel">
      <div
        style={{
          padding: "12px 0",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Avatar
          size={48}
          icon={<UserOutlined />}
          src={targetUser.avatarUrl}
        >
          {targetUser.fullName.charAt(0).toUpperCase()}
        </Avatar>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            {targetUser.fullName}
          </Title>
          <Text type="secondary">@{targetUser.username}</Text>
        </div>
      </div>

      <div
        style={{
          minHeight: 320,
          maxHeight: 420,
          overflow: "auto",
          padding: 12,
          background: "#f5f5f5",
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        {messages.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.senderId === user?.id ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    backgroundColor:
                      msg.senderId === user?.id ? "#1890ff" : "#fff",
                    color: msg.senderId === user?.id ? "#fff" : "inherit",
                    padding: "8px 14px",
                    borderRadius: 8,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  }}
                >
                  <div>{msg.content}</div>
                  <div style={{ fontSize: 10, opacity: 0.75, marginTop: 4 }}>
                    {formatViDate(msg.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <Empty description="Chưa có tin nhắn — hãy gửi lời chào đầu tiên!" />
        )}
      </div>

      <Input.Search
        placeholder="Nhập tin nhắn..."
        allowClear
        enterButton={
          <Button icon={<SendOutlined />} loading={sending}>
            Gửi
          </Button>
        }
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onSearch={handleSend}
        onPressEnter={handleSend}
      />
      <Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
        Lịch sử tin nhắn được lưu tự động. Bạn cũng có thể mở mục Tin nhắn trên thanh
        menu để xem tất cả cuộc trò chuyện.
      </Text>
    </div>
  );
}
