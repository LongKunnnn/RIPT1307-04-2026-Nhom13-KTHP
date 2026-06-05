import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Modal,
  Input,
  List,
  Avatar,
  Typography,
  Button,
  message,
  Spin,
  Empty,
  Space,
  Tabs,
  Alert,
  Badge,
} from "antd";
import {
  SearchOutlined,
  SendOutlined,
  MessageOutlined,
  UserOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import type { ChatConversation, ChatMessage, ChatUser } from "@/types";
import { chatService } from "@/services/chat/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { formatViDate } from "@/utils/format";

const { Text, Title } = Typography;

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  targetUser?: ChatUser;
}

function ChatAvatar({
  user: u,
  size = 40,
}: {
  user: { fullName: string; avatarUrl?: string };
  size?: number;
}) {
  return (
    <Avatar size={size} icon={<UserOutlined />} src={u.avatarUrl}>
      {u.fullName.charAt(0).toUpperCase()}
    </Avatar>
  );
}

export function ChatModal({ open, onClose, targetUser }: ChatModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [inboxTab, setInboxTab] = useState<"active" | "pending">("active");
  const [activeConversations, setActiveConversations] = useState<ChatConversation[]>([]);
  const [pendingConversations, setPendingConversations] = useState<ChatConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const startingRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const inbox = await chatService.getMyConversations();
      setActiveConversations(inbox.active);
      setPendingConversations(inbox.pending);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && isAuthenticated) {
      void loadConversations();
    }
  }, [open, isAuthenticated]);

  const currentList =
    inboxTab === "pending" ? pendingConversations : activeConversations;

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter(
      (c) =>
        c.otherUser.username.toLowerCase().includes(q) ||
        c.otherUser.fullName.toLowerCase().includes(q),
    );
  }, [currentList, searchQuery]);

  const startConversation = async (chatUser: ChatUser) => {
    if (startingRef.current === chatUser.id) return;
    startingRef.current = chatUser.id;
    setLoading(true);
    try {
      const conv = await chatService.getOrCreateConversation(chatUser.id);
      setSelectedConversation(conv);
      const msgs = await chatService.getMessages(conv.id);
      setMessages(msgs);
      setSearchQuery("");
      await loadConversations();
      if (conv.pendingForMe) setInboxTab("pending");
      else setInboxTab("active");
    } catch {
      message.error("Không thể bắt đầu cuộc trò chuyện!");
    } finally {
      setLoading(false);
      startingRef.current = null;
    }
  };

  useEffect(() => {
    if (open && targetUser && isAuthenticated) {
      void startConversation(targetUser);
    }
    if (!open) {
      startingRef.current = null;
      sendingRef.current = false;
      setInboxTab("active");
    }
  }, [open, targetUser?.id, isAuthenticated]);

  const selectConversation = async (conv: ChatConversation) => {
    setSelectedConversation(conv);
    try {
      const msgs = await chatService.getMessages(conv.id);
      setMessages(msgs);
    } catch {
      message.error("Không thể tải tin nhắn!");
    }
  };

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !selectedConversation || !user || sendingRef.current) return;

    const wasPending = selectedConversation.pendingForMe;
    sendingRef.current = true;
    setMessageInput("");
    try {
      const sentMsg = await chatService.sendMessage(
        selectedConversation.id,
        content,
      );
      setMessages((prev) => [...prev, sentMsg]);
      const updated = {
        ...selectedConversation,
        lastMessage: sentMsg,
        pendingForMe: false,
      };
      setSelectedConversation(updated);
      await loadConversations();
      if (wasPending) {
        setInboxTab("active");
        message.success("Đã chấp nhận tin nhắn — cuộc trò chuyện chuyển sang hộp thư chính");
      }
    } catch {
      setMessageInput(content);
      message.error("Không thể gửi tin nhắn!");
    } finally {
      sendingRef.current = false;
    }
  };

  const handleClose = () => {
    setSelectedConversation(null);
    setSearchQuery("");
    setMessages([]);
    onClose();
  };

  const renderConversationList = () => (
    <>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder={
            inboxTab === "pending"
              ? "Lọc tin nhắn đang chờ..."
              : "Lọc người đã từng nhắn tin..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
        <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: "block" }}>
          {inboxTab === "pending"
            ? "Tin từ người lạ — trả lời để chuyển vào hộp thư chính"
            : "Chỉ tìm trong danh sách đã nhắn tin. Tìm thành viên mới ở tab Thành viên trên diễn đàn."}
        </Text>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin />
          </div>
        ) : filteredConversations.length > 0 ? (
          <List
            dataSource={filteredConversations}
            renderItem={(conv) => (
              <List.Item
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    selectedConversation?.id === conv.id
                      ? "#e6f7ff"
                      : "transparent",
                }}
                onClick={() => selectConversation(conv)}
              >
                <List.Item.Meta
                  avatar={<ChatAvatar user={conv.otherUser} />}
                  title={conv.otherUser.fullName}
                  description={
                    <div>
                      <Text ellipsis style={{ maxWidth: 180, display: "block" }}>
                        {conv.lastMessage?.content || "Chưa có tin nhắn"}
                      </Text>
                      {conv.lastMessage && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatViDate(conv.lastMessage.createdAt)}
                        </Text>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description={
              searchQuery
                ? "Không có cuộc trò chuyện phù hợp"
                : inboxTab === "pending"
                  ? "Không có tin nhắn đang chờ"
                  : "Chưa có cuộc trò chuyện — tìm thành viên trên diễn đàn để bắt đầu"
            }
            style={{ padding: 40 }}
          />
        )}
      </div>
    </>
  );

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageOutlined style={{ color: "#1890ff" }} />
          <span>Tin nhắn</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      destroyOnClose
    >
      <div style={{ display: "flex", height: 600 }}>
        <div
          style={{
            width: "35%",
            borderRight: "1px solid #f0f0f0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Tabs
            activeKey={inboxTab}
            onChange={(k) => {
              setInboxTab(k as "active" | "pending");
              setSearchQuery("");
              setSelectedConversation(null);
              setMessages([]);
            }}
            items={[
              {
                key: "active",
                label: "Tin nhắn",
              },
              {
                key: "pending",
                label: (
                  <Badge count={pendingConversations.length} size="small" offset={[6, 0]}>
                    <span>
                      <InboxOutlined /> Đang chờ
                    </span>
                  </Badge>
                ),
              },
            ]}
            style={{ padding: "0 8px" }}
          />
          {renderConversationList()}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {selectedConversation ? (
            <>
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ChatAvatar user={selectedConversation.otherUser} size={48} />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {selectedConversation.otherUser.fullName}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      @{selectedConversation.otherUser.username}
                    </Text>
                  </div>
                </div>
                {selectedConversation.pendingForMe && (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: 12 }}
                    message="Tin nhắn đang chờ"
                    description="Người này chưa từng nhắn tin với bạn trước đây. Trả lời để chấp nhận và hiển thị trong hộp thư chính."
                  />
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "16px",
                  overflow: "auto",
                  backgroundColor: "#f5f5f5",
                }}
              >
                {messages.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent:
                            msg.senderId === user?.id
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            backgroundColor:
                              msg.senderId === user?.id ? "#1890ff" : "white",
                            color:
                              msg.senderId === user?.id ? "white" : "black",
                            padding: "10px 16px",
                            borderRadius: 8,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          }}
                        >
                          <Text
                            style={{
                              color:
                                msg.senderId === user?.id ? "white" : undefined,
                            }}
                          >
                            {msg.content}
                          </Text>
                          <div
                            style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}
                          >
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

              <div style={{ padding: "16px", borderTop: "1px solid #f0f0f0" }}>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder={
                      selectedConversation.pendingForMe
                        ? "Trả lời để chấp nhận tin nhắn..."
                        : "Nhập tin nhắn..."
                    }
                    allowClear
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      void handleSendMessage();
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => void handleSendMessage()}
                  >
                    Gửi
                  </Button>
                </Space.Compact>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Empty description="Chọn một cuộc trò chuyện để bắt đầu" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
