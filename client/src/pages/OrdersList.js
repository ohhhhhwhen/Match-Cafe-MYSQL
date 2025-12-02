// src/components/OrdersList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { List, Typography, Tag, Card, Tabs } from "antd";
import OrderDetailsModal from "../components/OrderDetailsModal";
import Header from "../components/Header";

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

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("current");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:8800/Orders");
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };
    fetchOrders();
  }, []);

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);

    if (key === "current") {
      setFilteredOrders(
        orders.filter((order) => order.order_status !== "Completed")
      );
    } else if (key === "completed") {
      setFilteredOrders(
        orders.filter((order) => order.order_status === "Completed")
      );
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    const updatedList = orders.map((o) =>
      o.order_id === updatedOrder.order_id ? updatedOrder : o
    );
    setOrders(updatedList);

    // Re-filter if needed
    if (activeTab === "completed") {
      setFilteredOrders(
        updatedList.filter((o) => o.order_status === "Completed")
      );
    } else {
      setFilteredOrders(
        updatedList.filter((o) => o.order_status !== "Completed")
      );
    }
  };

  return (
    <div style={{ height: "100vh", backgroundColor: "#8ba888" }}>
      <Header />
      <div style={{ padding: "16px" }}>
        <Tabs
          defaultActiveKey="current"
          activeKey={activeTab}
          onChange={handleTabChange}
          style={{ marginBottom: 16 }}
          items={[
            {
              key: "current",
              label: `Current Orders (${
                orders.filter((o) => o.order_status !== "Completed").length
              })`,
            },
            {
              key: "completed",
              label: `Completed (${
                orders.filter((o) => o.order_status === "Completed").length
              })`,
            },
          ]}
        />
        <List
          header={
            <div style={{ fontWeight: "bold", fontSize: "20px" }}>
              {activeTab === "current" ? "Current Orders" : "Completed"} (
              {filteredOrders.length})
            </div>
          }
          bordered
          dataSource={filteredOrders}
          renderItem={(order) => (
            <List.Item
              key={order.order_id}
              onClick={() => openModal(order)}
              style={{
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fafafa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Card
                size="small"
                bordered={false}
                style={{ width: "100%", background: "transparent" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Left side: Order info */}
                  <div>
                    <Text code style={{ marginRight: 10 }}>
                      #{order.order_id}
                    </Text>
                    <Text strong>{order.customer_name}</Text>
                    <span style={{ margin: "0 16px", color: "#888" }}>|</span>
                    <Text>
                      Total:{" "}
                      <Text strong style={{ color: "#005500" }}>
                        ${order.total.toFixed(2)}
                      </Text>
                    </Text>
                  </div>

                  {/* Right side: Status + Date */}
                  <div>
                    <Tag
                      color={getStatusColor(order.order_status)}
                      style={{ marginRight: 16 }}
                    >
                      {order.order_status.toUpperCase()}
                    </Tag>
                    <Text type="secondary">
                      {order.timestamp.split(" ")[0]}
                    </Text>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />

        {selectedOrder && (
          <OrderDetailsModal
            visible={isModalVisible}
            onClose={closeModal}
            order={selectedOrder}
            onOrderUpdate={handleOrderUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default OrdersList;
