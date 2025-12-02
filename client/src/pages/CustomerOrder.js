import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import {
  Flex,
  Typography,
  Row,
  Col,
  Button,
  Card,
  Form,
  Input,
  List,
} from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import ConfirmedOrderModal from "../components/ConfirmedOrderModal";
const { Text } = Typography;

const CustomerOrder = () => {
  const [openModal, setOpenModal] = useState(false);
  const [currentMenu, setCurrentMenu] = useState([]);
  const [form] = Form.useForm();
  const [orderedItems, setOrderedItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [completedOrder, setCompletedOrder] = useState({
    order_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    total: 0,
    status: "Pending", // Default status
    timestamp: "",
    items_details: [], // This will hold the ordered items array
  });

  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axios.get("http://localhost:8800/Menu");
        setCurrentMenu(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchMenu();
  }, []);

  const navigate = useNavigate();

  const handleAddToOrder = (itemToAdd) => {
    setOrderedItems((prevItems) => {
      // 1. Check if the item already exists in the cart by item_id
      const existingItemIndex = prevItems.findIndex(
        (item) => item.item_id === itemToAdd.item_id
      );

      let newItems;

      if (existingItemIndex > -1) {
        // 2. Item exists: Increment quantity while preserving all other properties (like 'name')
        newItems = prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 } // Spread 'item' includes 'name'
            : item
        );
      } else {
        // 3. Item is new: Add all properties from itemToAdd (including 'name') and initialize quantity: 1
        const newItem = {
          ...itemToAdd, // This includes name, price, item_id, etc.
          quantity: 1,
        };
        newItems = [...prevItems, newItem];
      }

      // 4. Update total price calculation
      setTotalPrice(
        newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      );

      return newItems;
    });
  };

  const handleRemoveFromOrder = (itemToRemove) => {
    setOrderedItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.item_id === itemToRemove.item_id
      );

      if (existingItemIndex === -1) {
        return prevItems;
      }

      const existingItem = prevItems[existingItemIndex];
      let newItems;

      if (existingItem.quantity > 1) {
        // 1. Quantity > 1: Decrement quantity by 1, preserving all other properties (like 'name')
        newItems = prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity - 1 } // Spread 'item' includes 'name'
            : item
        );
      } else {
        // 2. Quantity is 1: Filter the item out completely
        newItems = prevItems.filter(
          (item) => item.item_id !== itemToRemove.item_id
        );
      }

      // 3. Update total price calculation
      setTotalPrice(
        newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      );

      return newItems;
    });
  };

  const isSubmitDisabled = () => {
    const { name, email, phone } = formValues;
    return !name || !email || !phone || orderedItems.length === 0;
  };

  const handleSubmit = async (values) => {
    // Check if there are items in the order
    if (orderedItems.length === 0) {
      return;
    }

    // Prepare the items_details array with the necessary price field
    const itemsForBackend = orderedItems.map((item) => ({
      item_id: item.item_id, // Ensure this matches the Menu table PK column name
      quantity: item.quantity,
      price_at_order: item.price, // This must be the price when added to the cart
      name: item.name,
    }));

    const newOrder = {
      // ❌ REMOVED: order_id: Date.now(), // Let the database generate the ID
      customer_name: values.name,
      customer_email: values.email,
      customer_phone: values.phone,
      total: totalPrice,
      order_status: "Pending",
      timestamp: new Date().toISOString().slice(0, 19).replace("T", " "), // Format for MySQL
      items_details: itemsForBackend, // Send the updated structure
    };

    // Set the completed order state and open modal (UI logic)
    setCompletedOrder(newOrder);
    setOpenModal(true);

    // Now submit the order to the backend
    try {
      // The backend will return a 201 status and the actual new order_id
      const response = await axios.post(
        "http://localhost:8800/Orders",
        newOrder
      );
      console.log("Order submitted successfully, ID:", response.data.order_id);
      navigate("/"); // Redirect after successful submission
    } catch (err) {
      console.error("Order submission error:", err);
      // Optional: Add logic to display error to user
    }
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    return cleaned.slice(0, 10);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const formattedPhoneNumber = formatPhoneNumber(value);
    e.target.value = formattedPhoneNumber;
    form.setFieldsValue({ phone: formattedPhoneNumber });
    setFormValues((prev) => ({ ...prev, phone: formattedPhoneNumber }));
  };

  const handleFormChange = (changedValues) => {
    setFormValues((prev) => ({
      ...prev,
      ...changedValues,
    }));
  };

  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const { category } = item;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  };

  const groupedInventory = groupByCategory(currentMenu);

  return (
    <>
      <Header />
      <div style={{ padding: "0 16px 16px 16px" }}>
        {Object.keys(groupedInventory).map((category) => (
          <div key={category} style={{ marginBottom: "2rem" }}>
            <h2>{category}</h2>
            <Row gutter={[16, 16]}>
              {groupedInventory[category].map((item) => (
                <Col key={item.item_id} xs={24} sm={24} md={12} lg={12}>
                  <Card>
                    <Flex
                      justify="space-between"
                      style={{ marginBottom: "1rem" }}
                    >
                      <Text>{item.name}</Text>
                      <Text>Price: ${item.price.toFixed(2)}</Text>
                    </Flex>
                    <div style={{ marginBottom: "1rem" }}>
                      <Text>{item.description}</Text>
                    </div>
                    <Button
                      type="primary"
                      onClick={() => handleAddToOrder(item)}
                    >
                      Add to Order
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))}

        {/* Order Form Container */}
        <div
          style={{ marginTop: "3rem", background: "#f0f2f5", padding: "24px", borderRadius: 8 }}
        >
          <h2>Order Details</h2>
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            onValuesChange={handleFormChange}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Please input your name" }]}
            >
              <Input placeholder="Enter your name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Please input a valid email",
                },
              ]}
            >
              <Input placeholder="Enter your email" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                {
                  required: true,
                  message: "Please input your phone number",
                  pattern: /^\d{3}-\d{3}-\d{4}$/,
                },
              ]}
            >
              <Input
                placeholder="Enter your phone number"
                type="tel"
                onChange={handlePhoneChange}
              />
            </Form.Item>

            {/* Ordered Items Section */}
            <Form.Item label="Items Ordered">
              <List
                bordered
                dataSource={orderedItems}
                renderItem={(item) => (
                  <List.Item>
                    <Flex
                      align="center"
                      justify="space-between"
                      style={{ width: "100%" }}
                    >
                      <Text>
                        {item.name} - ${item.price.toFixed(2)}
                      </Text>
                      <Flex align="center" gap={10}>
                        <Button
                          icon={<MinusOutlined />}
                          onClick={() => handleRemoveFromOrder(item)}
                        />
                        <Text style={{ minWidth: 30, textAlign: 'center' }}>{item.quantity}</Text>
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => handleAddToOrder(item)}
                        />
                      </Flex>
                    </Flex>
                  </List.Item>
                )}
              />
            </Form.Item>

            {/* Total Price Section */}
            <Form.Item label="Total Price">
              <Text strong>${totalPrice.toFixed(2)}</Text>
            </Form.Item>

            {/* Submit Button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={isSubmitDisabled()}
              >
                Submit Order
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      {openModal && (
        <ConfirmedOrderModal
          setOpenModal={setOpenModal}
          completedOrder={completedOrder}
        />
      )}
    </>
  );
};

export default CustomerOrder;
