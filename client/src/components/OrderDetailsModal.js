import React, { useState } from "react";
import {
  Modal,
  List,
  Card,
  Collapse,
  Typography,
  Tag,
  Flex,
  message,
} from "antd";
import axios from "axios";

const { Panel } = Collapse;
const { Text } = Typography;

const getStatusColor = (status) => {
  switch (status) {
    case "Completed":
      return "success";
    case "Pending":
      return "warning";
    case "In Progress":
      return "processing";
    default:
      return "default";
  }
};

const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"];

const OrderDetailsModal = ({ visible, onClose, order, onOrderUpdate }) => {
  const [items, setItems] = useState(order.items_details);
  const [orderStatus, setOrderStatus] = useState(order.order_status);

  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      // Optimistically update local state
      const updatedItems = items.map((item) =>
        item.item_id === itemId ? { ...item, item_status: newStatus } : item
      );
      setItems(updatedItems);

      // Call backend with new item status
      const res = await axios.put(
        `http://localhost:8800/OrderDetails/${order.order_id}/${itemId}/status`,
        { item_status: newStatus }
      );

      // The backend now returns the *new* order_status (Completed/In Progress)
      const newOrderStatus = res.data.order_status || order.order_status;
      setOrderStatus(newOrderStatus);

      // ✅ Notify the parent list that both item + order changed
      onOrderUpdate({
        ...order,
        order_status: newOrderStatus,
        items_details: updatedItems,
      });
    } catch (err) {
      console.error("Error updating status:", err);
      message.error("Failed to update status");
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
          paddingRight: 10,
        },
      }}
      title={
        <>
          <Text code>#{order.order_id}</Text> —{" "}
          <Text strong>{order.customer_name}</Text>{" "}
          <Tag color={getStatusColor(orderStatus)} style={{ marginLeft: 10 }}>
            {orderStatus.toUpperCase()}
          </Tag>
        </>
      }
    >
      <Text strong>Total:</Text>{" "}
      <Text style={{ color: "#005500" }}>${order.total.toFixed(2)}</Text>
      <br />
      <Text type="secondary">
        Placed on: {new Date(order.timestamp).toLocaleString()}
      </Text>
      <br />
      <br />
      <Card
        size="small"
        title="Ordered Items"
        style={{ marginBottom: 16, backgroundColor: "#fafafa" }}
      >
        <List
          dataSource={items}
          renderItem={(item) => (
            <List.Item key={item.item_id}>
              <List.Item.Meta
                title={
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Text strong>{item.item_name}</Text>
                    <Text type="secondary">(x{item.quantity})</Text>
                  </div>
                }
                description={
                  <>
                    <Text type="secondary">
                      Price: ${item.price_at_order.toFixed(2)}
                    </Text>

                    {/* ✅ Clickable Status Tags */}
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Update Item Status: </Text>
                      <Flex gap={8}>
                        {STATUS_OPTIONS.map((status) => (
                          <Tag
                            key={status}
                            color={
                              item.item_status === status
                                ? getStatusColor(status)
                                : "default"
                            }
                            style={{
                              cursor: "pointer",
                              border:
                                item.item_status === status
                                  ? "2px solid #1677ff"
                                  : "1px solid #ccc",
                              fontWeight:
                                item.item_status === status ? "bold" : "normal",
                              opacity: item.item_status === status ? 1 : 0.6,
                              transition: "all 0.2s",
                            }}
                            onClick={() =>
                              handleStatusUpdate(item.item_id, status)
                            }
                          >
                            {status}
                          </Tag>
                        ))}
                      </Flex>
                    </div>

                    {item.category === "Drinks" && (
                      <Collapse
                        bordered={false}
                        size="small"
                        style={{ backgroundColor: "#fff", marginTop: 10 }}
                      >
                        <Panel header="Show Ingredient Breakdown" key="1">
                          <List
                            size="small"
                            dataSource={item.ingredients_needed}
                            renderItem={(ing) => (
                              <List.Item key={ing.ingredient_id}>
                                <Text strong>{ing.ingredient_name}:</Text>{" "}
                                <Text
                                  type={
                                    ing.currentStock <
                                    ing.total_ingredient_needed
                                      ? "danger"
                                      : "secondary"
                                  }
                                >
                                  {ing.total_ingredient_needed.toFixed(2)} units
                                  needed.
                                </Text>
                                {ing.currentStock <
                                  ing.total_ingredient_needed && (
                                  <Tag color="error" style={{ marginLeft: 8 }}>
                                    LOW STOCK
                                  </Tag>
                                )}
                              </List.Item>
                            )}
                          />
                        </Panel>
                      </Collapse>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Modal>
  );
};

export default OrderDetailsModal;
