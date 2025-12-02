import React, { useEffect, useState } from "react";
import axios from "axios";
import { Flex, Typography, Row, Col, Progress, Button, Card } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import Header from "../components/Header";
import InventoryModal from "../components/InventoryModal";

const { Text } = Typography;

const Inventory = () => {
  const [currentInventory, setCurrentInventory] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get("http://localhost:8800/Ingredients");
        setCurrentInventory(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchInventory();
  }, []);

  const handleAddToShoppingList = (addedItem) => {
    setShoppingList((prevList) => {
      const alreadyExists = prevList.some(
        (item) => item.ingredient_id === addedItem.ingredient_id
      );

      if (alreadyExists) return prevList;

      return [...prevList, addedItem];
    });
  };

  const handleRemoveFromShoppingList = (itemToRemove) => {
    setShoppingList((prevList) =>
      prevList.filter(
        (item) => item.ingredient_id !== itemToRemove.ingredient_id
      )
    );
  };

  return (
    <>
      <Header />
      <Flex
        align="center"
        justify="space-between"
        style={{ width: "100%", margin: "20px 0px" }}
      >
        <Text
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "#1f2937",
            margin: "0px auto",
          }}
        >
          Ingredient Inventory Tracker
        </Text>
        <Button
          type="link"
          onClick={() => setOpenModal(true)}
          style={{
            fontSize: "24px",
            marginRight: "16px",
          }}
          icon={<ShoppingCartOutlined />}
        />
      </Flex>

      <div style={{ padding: "0 16px 16px 16px" }}>
        {/* Added padding to the sides */}
        <Row gutter={[16, 16]}>
          {/* Added vertical and horizontal gutter */}
          {currentInventory.map((item, index) => (
            <Col
              key={index}
              xs={24}
              sm={12}
              md={8}
              lg={8} // Responsive grid settings
            >
              <Card title={item.name}>
                <Flex align="center" justify="space-between">
                  <Text>Stock Available:</Text>
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      backgroundColor: "green",
                      color: "black",
                    }}
                  >
                    {item.currentStock === 0
                      ? "Out of Stock"
                      : `${item.currentStock}`}
                  </span>
                </Flex>
                <Text>Target Stock: {item.targetStock}</Text>
                <Progress
                  percent={(item.currentStock / item.targetStock) * 100}
                  showInfo={false}
                  //   strokeColor="red"
                />
                <Button onClick={() => handleAddToShoppingList(item)}>
                  {shoppingList.some(
                    (i) => i.ingredient_id === item.ingredient_id
                  )
                    ? "In List"
                    : "Add to Shop List"}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {openModal && (
        <InventoryModal
          setOpenModal={setOpenModal}
          shoppingList={shoppingList}
          handleRemoveFromShoppingList={handleRemoveFromShoppingList}
        />
      )}
    </>
  );
};

export default Inventory;