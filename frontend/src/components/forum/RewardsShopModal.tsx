import { useEffect, useState } from "react";
import {
  Button,
  List,
  Modal,
  Space,
  Tag,
  Typography,
  message,
  Divider,
  Card,
  Badge,
  Empty,
} from "antd";
import {
  GiftOutlined,
  ShoppingCartOutlined,
  HistoryOutlined,
  CopyOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { RewardItem, UserVoucher } from "@/types";
import { rewardsService } from "@/services/rewards/rewardsService";
import { useAuth } from "@/contexts/AuthContext";
import { formatViDate } from "@/utils/format";

const { Text, Paragraph, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onPointsChange?: (points: number) => void;
}

export function RewardsShopModal({ open, onClose, onPointsChange }: Props) {
  const { user, refreshProfile, isAuthenticated } = useAuth();
  const [items, setItems] = useState<RewardItem[]>([]);
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [points, setPoints] = useState(user?.rewardPoints ?? 0);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"shop" | "inventory">("shop");

  useEffect(() => {
    if (!open) return;
    setPoints(user?.rewardPoints ?? 0);
    rewardsService
      .getCatalog()
      .then(setItems)
      .catch(() => setItems([]));
    if (isAuthenticated) {
      rewardsService
        .getWallet()
        .then((w) => setPoints(w.rewardPoints))
        .catch(() => undefined);
      rewardsService
        .getMyVouchers()
        .then(setVouchers)
        .catch(() => setVouchers([]));
    }
  }, [open, user?.rewardPoints, isAuthenticated]);

  const redeem = async (item: RewardItem) => {
    if (!isAuthenticated) {
      message.info("Đăng nhập để đổi quà");
      return;
    }
    setLoading(true);
    try {
      const res = await rewardsService.redeem(item.id);
      setPoints(res.rewardPoints);
      onPointsChange?.(res.rewardPoints);
      await refreshProfile();
      message.success(`Đã đổi: ${res.item.title}`);
      // Refresh vouchers
      rewardsService
        .getMyVouchers()
        .then(setVouchers)
        .catch(() => undefined);
      setTab("inventory");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Không đổi được");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success("Đã sao chép mã voucher");
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <GiftOutlined style={{ color: "#f59e0b" }} />
          <span>Cửa hàng & Kho voucher</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <Button
            type={tab === "shop" ? "primary" : "default"}
            icon={<ShoppingCartOutlined />}
            onClick={() => setTab("shop")}
          >
            Cửa hàng
          </Button>
          <Badge count={vouchers.length} offset={[5, 0]}>
            <Button
              type={tab === "inventory" ? "primary" : "default"}
              icon={<HistoryOutlined />}
              onClick={() => setTab("inventory")}
            >
              Kho của tôi
            </Button>
          </Badge>
        </Space>
        <Tag
          color="gold"
          style={{ fontSize: 14, padding: "4px 10px", margin: 0 }}
        >
          Số dư: {points.toLocaleString("vi-VN")} điểm
        </Tag>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      {tab === "shop" ? (
        <>
          <Paragraph type="secondary">
            Tích lũy điểm khi câu trả lời được chấp nhận. Dùng điểm để đổi lấy
            voucher giá trị.
          </Paragraph>
          <List
            dataSource={items}
            locale={{ emptyText: "Chưa có phần quà" }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="redeem"
                    type="primary"
                    size="small"
                    loading={loading}
                    disabled={points < item.cost || item.stock <= 0}
                    onClick={() => redeem(item)}
                  >
                    Đổi {item.cost} điểm
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={item.title}
                  description={
                    <Space direction="vertical" size={0}>
                      {item.description && (
                        <Text type="secondary">{item.description}</Text>
                      )}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Còn {item.stock} · Giá {item.cost} điểm
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </>
      ) : (
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {vouchers.length === 0 ? (
            <Empty description="Bạn chưa có voucher nào. Hãy đổi điểm tại Cửa hàng!" />
          ) : (
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
            >
              {vouchers.map((v) => (
                <Card
                  key={v.id}
                  size="small"
                  className={v.isUsed ? "voucher-used" : ""}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <Title level={5} style={{ margin: 0 }}>
                        {v.itemTitle}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Đã đổi ngày {formatViDate(v.createdAt)}
                      </Text>
                    </div>
                    {v.isUsed ? (
                      <Tag color="default" icon={<CheckCircleOutlined />}>
                        Đã dùng
                      </Tag>
                    ) : (
                      <Tag color="green">Sẵn sàng</Tag>
                    )}
                  </div>
                  <Divider style={{ margin: "8px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#f8fafc",
                      padding: "8px",
                      borderRadius: "4px",
                    }}
                  >
                    <Text code style={{ fontSize: 16, letterSpacing: "1px" }}>
                      {v.voucherCode}
                    </Text>
                    <Button
                      type="link"
                      icon={<CopyOutlined />}
                      onClick={() => copyCode(v.voucherCode)}
                      disabled={v.isUsed}
                    >
                      Sao chép
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
