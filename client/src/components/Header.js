import React from "react";
import { Flex } from "antd";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <Flex gap={10} justify="flex-end">
      <Link to="/">Order</Link>
      <Link to="/OrdersList">Orders List</Link>
      <Link to="/Inventory">Inventory</Link>
      <Link /* to="/" */>User/Admin</Link>
    </Flex>
  );
};

export default Header;
