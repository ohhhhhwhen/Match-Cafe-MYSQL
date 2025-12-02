import React from "react";
import { Modal, List, Flex, Typography } from "antd";
const { Text } = Typography;

const ConfirmedOrderModal = ({ setOpenModal, completedOrder }) => {
  const handleOk = () => {
    setOpenModal(false);
  };
  const handleCancel = () => {
    setOpenModal(false);
  };

  return (
    <>
      <Modal
        title="Order Confirmed"
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
        <p>Name:</p>
        <p>{completedOrder.customer_name}</p>
        <p>Email:</p>
        <p>{completedOrder.customer_email}</p>
        <p>Phone Number:</p>
        <p>{completedOrder.customer_phone}</p>
        <p>Ordered Item(s):</p>
        <List
          bordered
          dataSource={completedOrder.items_details}
          renderItem={(item) => (
            <List.Item>
              <Flex
                align="center"
                justify="space-between"
                style={{ width: "100%" }}
              >
                <Text>
                  {item.name} - ${item.price_at_order.toFixed(2)}
                </Text>
              </Flex>
            </List.Item>
          )}
        />
        <p>Total Price:</p>
        <p>${completedOrder.total.toFixed(2)}</p>
      </Modal>
    </>
  );
};
export default ConfirmedOrderModal;
