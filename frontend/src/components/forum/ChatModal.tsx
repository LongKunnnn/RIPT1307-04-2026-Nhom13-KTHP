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
} from "antd";
import {
  SearchOutlined,
  SendOutlined,
  MessageOutlined,
  UserOutlined,
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
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const convs = await chatService.getMyConversations();
      setConversations(convs);
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

  const startConversation = async (chatUser: ChatUser) => {
    setLoading(true);
    try {
      const conv = await chatService.getOrCreateConversation(chatUser.id);
      setSelectedConversation(conv);
      const msgs = await chatService.getMessages(conv.id);
      setMessages(msgs);
      setSearchQuery("");
      setSearchResults([]);
      await loadConversations();
    } catch {
      message.error("Không thể bắt đầu cuộc trò chuyện!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && targetUser && isAuthenticated) {
      void startConversation(targetUser);
    }
  }, [open, targetUser?.id, isAuthenticated]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.otherUser.username.toLowerCase().includes(q) ||
        c.otherUser.fullName.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const users = await chatService.searchUsers(query);
      setSearchResults(users);
    } catch (err) {
      console.error("Failed to search users:", err);
    } finally {
      setSearchLoading(false);
    }
  };

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
    if (!messageInput.trim() || !selectedConversation || !user) return;
    try {
      const sentMsg = await chatService.sendMessage(
        selectedConversation.id,
        messageInput,
      );
      setMessages((prev) => [...prev, sentMsg]);
      setMessageInput("");
      setSelectedConversation({
        ...selectedConversation,
        lastMessage: sentMsg,
      });
      await loadConversations();
    } catch {
      message.error("Không thể gửi tin nhắn!");
    }
  };

  const handleClose = () => {
    setSelectedConversation(null);
    setSearchQuery("");
    setSearchResults([]);
    setMessages([]);
    onClose();
  };

  const showGlobalSearch =
    searchQuery.trim().length > 0 && searchResults.length > 0;

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
          <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên hoặc @username..."
              value={searchQuery}
              onChange={handleSearch}
              allowClear
            />
            <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: "block" }}>
              Gõ để lọc cuộc trò chuyện hoặc tìm thành viên mới
            </Text>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {searchLoading ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin />
              </div>
            ) : (
              <>
                {filteredConversations.length > 0 && (
                  <>
                    <Text
                      type="secondary"
                      style={{ padding: "8px 16px", display: "block", fontSize: 12 }}
                    >
                      Cuộc trò chuyện
                    </Text>
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
                  </>
                )}

                {showGlobalSearch && (
                  <>
                    <Text
                      type="secondary"
                      style={{ padding: "8px 16px", display: "block", fontSize: 12 }}
                    >
                      Tìm thêm thành viên
                    </Text>
                    <List
                      dataSource={searchResults.filter(
                        (u) =>
                          !filteredConversations.some(
                            (c) => c.otherUser.id === u.id,
                          ),
                      )}
                      renderItem={(userItem) => (
                        <List.Item
                          style={{ cursor: "pointer" }}
                          onClick={() => startConversation(userItem)}
                        >
                          <List.Item.Meta
                            avatar={<ChatAvatar user={userItem} />}
                            title={userItem.fullName}
                            description={`@${userItem.username}`}
                          />
                        </List.Item>
                      )}
                    />
                  </>
                )}

                {!searchLoading &&
                  filteredConversations.length === 0 &&
                  !showGlobalSearch && (
                    <Empty
                      description={
                        searchQuery
                          ? "Không có cuộc trò chuyện phù hợp"
                          : "Chưa có cuộc trò chuyện — tìm tên để bắt đầu"
                      }
                      style={{ padding: 40 }}
                    />
                  )}

                {searchQuery &&
                  !searchLoading &&
                  filteredConversations.length === 0 &&
                  searchResults.length === 0 && (
                    <Empty
                      description="Không tìm thấy người dùng"
                      style={{ padding: 40 }}
                    />
                  )}
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {selectedConversation ? (
            <>
              <div
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
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
                <Input.Search
                  placeholder="Nhập tin nhắn..."
                  allowClear
                  enterButton={<Button icon={<SendOutlined />}>Gửi</Button>}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onSearch={handleSendMessage}
                  onPressEnter={handleSendMessage}
                />
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
