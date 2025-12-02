import React from "react";
import { Modal, List, Flex, Typography, Button } from "antd";
import axios from "axios";
const { Text } = Typography;

const InventoryModal = ({
  setOpenModal,
  shoppingList,
  handleRemoveFromShoppingList,
}) => {
  const handleOk = async () => {
    try {
      // Run all updates in parallel
      await Promise.all(
        shoppingList.map((item) =>
          axios.put(`http://localhost:8800/Ingredients/${item.ingredient_id}`, {
            currentStock: item.currentStock + item.targetStock,
          })
        )
      );
      setOpenModal(false);
    } catch (err) {
      console.error("Error updating inventory:", err);
    }
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  return (
    <>
      <Modal
        title="Shopping List"
        closable={{ "aria-label": "Custom Close Button" }}
        open={true}
        centered
        styles={{
          body: {
            maxHeight: "70vh",
            overflowY: "auto",
            paddingRight: 10,
          },
        }}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <List
          bordered
          dataSource={shoppingList}
          renderItem={(item) => (
            <List.Item>
              <Flex
                align="center"
                justify="space-between"
                style={{ width: "100%" }}
              >
                <Text>
                  {item.name} - {item.targetStock}
                </Text>
                <Button
                  type="text"
                  danger
                  onClick={() => handleRemoveFromShoppingList(item)}
                >
                  Remove
                </Button>
              </Flex>
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};
export default InventoryModal;
