import express from "express";
import mysql from "mysql";
import cors from "cors";

const app = express();

const db = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "Chan6936!!",
  database: "test",
});

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json("hello this is the backend");
});

app.get("/Ingredients", (req, res) => {
  const q = "SELECT * FROM Ingredients";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.put("/Ingredients/:ingredient_id", (req, res) => {
  const { ingredient_id } = req.params;
  const { currentStock } = req.body;

  const q = `
      UPDATE Ingredients
      SET currentStock = ?
      WHERE ingredient_id = ?;
    `;

  db.query(q, [currentStock, ingredient_id], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200);
  });
});

app.get("/Recipes", (req, res) => {
  const q = "SELECT * FROM Recipes";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/Menu", (req, res) => {
  const q = "SELECT * FROM Menu";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/OrderDetails", (req, res) => {
  const q = "SELECT * FROM OrderDetails";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.put("/OrderDetails/:order_id/:item_id/status", (req, res) => {
  const { item_status } = req.body;
  const { order_id, item_id } = req.params;

  // Step 1️⃣ - Get the current item status before updating
  const getCurrentStatusQ = `
      SELECT item_status, quantity
      FROM OrderDetails
      WHERE order_id = ? AND item_id = ?;
    `;

  db.query(getCurrentStatusQ, [order_id, item_id], (getErr, result) => {
    if (getErr) return res.status(500).json(getErr);
    if (!result.length)
      return res.status(404).json({ error: "Item not found in order" });

    const previousStatus = result[0].item_status;
    const ordered_quantity = result[0].quantity;

    // Step 2️⃣ - Update the specific item's status
    const updateItemQ = `
        UPDATE OrderDetails
        SET item_status = ?
        WHERE order_id = ? AND item_id = ?;
      `;

    db.query(updateItemQ, [item_status, order_id, item_id], (updateErr) => {
      if (updateErr) return res.status(500).json(updateErr);

      // Step 3️⃣ - Deduct inventory only if:
      //    → New status = "Completed"
      //    → Previous status ≠ "Completed" (safety check)
      if (item_status === "Completed" && previousStatus !== "Completed") {
        const deductQ = `
            SELECT 
              R.ingredient_id,
              R.quantity AS recipe_unit_quantity,
              ?
              AS ordered_quantity
            FROM Recipes R
            WHERE R.item_id = ?;
          `;

        db.query(
          deductQ,
          [ordered_quantity, item_id],
          (deductErr, ingredients) => {
            if (deductErr) return res.status(500).json(deductErr);

            ingredients.forEach((ing) => {
              const totalUsed = ing.recipe_unit_quantity * ing.ordered_quantity;

              const updateStockQ = `
                UPDATE Ingredients
                SET currentStock = GREATEST(currentStock - ?, 0)
                WHERE ingredient_id = ?;
              `;

              db.query(
                updateStockQ,
                [totalUsed, ing.ingredient_id],
                (stockErr) => {
                  if (stockErr)
                    console.error("Error updating stock:", stockErr);
                }
              );
            });
          }
        );
      }

      // Step 4️⃣ - Check all items to decide order's overall status
      const checkQ = `
          SELECT 
            SUM(CASE WHEN item_status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN item_status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
            COUNT(*) AS total_count
          FROM OrderDetails
          WHERE order_id = ?;
        `;

      db.query(checkQ, [order_id], (checkErr, checkRes) => {
        if (checkErr) return res.status(500).json(checkErr);

        const { completed_count, pending_count, total_count } = checkRes[0];
        let newOrderStatus = "In Progress";

        if (completed_count === total_count) {
          newOrderStatus = "Completed"; // ✅ all done
        } else if (pending_count === total_count) {
          newOrderStatus = "Pending"; // 🟡 nothing started yet
        } else {
          newOrderStatus = "In Progress"; // 🔵 mixed states
        }

        const updateOrderQ = `
            UPDATE Orders
            SET order_status = ?
            WHERE order_id = ?;
          `;

        db.query(updateOrderQ, [newOrderStatus, order_id], (updateErr) => {
          if (updateErr) return res.status(500).json(updateErr);

          return res.status(200).json({
            success: true,
            order_status: newOrderStatus,
          });
        });
      });
    });
  });
});

app.get("/Orders", (req, res) => {
  // SQL Query: Selecting the precise column names
  const q = `
        SELECT 
            O.order_id,
            O.customer_name,
            O.customer_email,
            O.customer_phone,
            O.total,
            O.order_status,       
            O.timestamp,
            OD.quantity AS ordered_quantity,
            OD.price_at_order,
            OD.item_status,         
            M.item_id,
            M.name AS item_name,
            M.category,
            R.recipe_id,
            R.quantity AS recipe_unit_quantity,
            I.ingredient_id,
            I.name AS ingredient_name,
            I.currentStock,
            I.targetStock
        FROM 
            Orders O
        INNER JOIN 
            OrderDetails OD ON O.order_id = OD.order_id
        INNER JOIN 
            Menu M ON OD.item_id = M.item_id
        INNER JOIN
            Recipes R ON M.item_id = R.item_id
        INNER JOIN
            Ingredients I ON R.ingredient_id = I.ingredient_id
        ORDER BY
            O.timestamp DESC;
    `;

  db.query(q, (err, data) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json(err);
    }

    const ordersMap = new Map();

    data.forEach((row) => {
      const {
        order_id,
        customer_name,
        customer_email,
        customer_phone,
        total,
        order_status, // CORRECT: Destructure as order_status
        timestamp,
        ordered_quantity,
        price_at_order,
        item_status, // Destructure item_status
        item_name,
        item_id,
        category,
        recipe_id,
        recipe_unit_quantity,
        ingredient_id,
        ingredient_name,
        currentStock,
        targetStock,
      } = row;

      // 1. Initialize Order in the Map (Order Header)
      if (!ordersMap.has(order_id)) {
        ordersMap.set(order_id, {
          order_id,
          customer_name,
          customer_email,
          customer_phone,
          total,
          order_status,
          timestamp,
          items_details: [],
        });
      }

      const currentOrder = ordersMap.get(order_id);

      // 2. Find/Create the Item within the Order
      let currentItem = currentOrder.items_details.find(
        (i) => i.item_id === item_id
      );

      if (!currentItem) {
        currentItem = {
          item_id,
          item_name,
          category,
          quantity: ordered_quantity,
          price_at_order,
          item_status, // Include item_status here
          ingredients_needed: [],
        };
        currentOrder.items_details.push(currentItem);
      }

      // 3. Add Ingredient Details to the Item
      currentItem.ingredients_needed.push({
        ingredient_id,
        ingredient_name,
        recipe_id,
        recipe_unit_quantity,
        total_ingredient_needed: ordered_quantity * recipe_unit_quantity,
        currentStock,
        targetStock,
      });
    });

    // 4. Convert the Map values to an array and send
    const nestedOrders = Array.from(ordersMap.values());
    return res.json(nestedOrders);
  });
});

app.post("/Orders", (req, res) => {
  const orderData = req.body;
  const itemsDetails = orderData.items_details;

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection error:", err);
      return res.status(500).json({ error: "Could not connect to database" });
    }

    connection.beginTransaction((transactionErr) => {
      if (transactionErr) {
        connection.release();
        return res.status(500).json({ error: "Failed to start transaction" });
      }

      const insertOrderQuery =
        "INSERT INTO Orders (`customer_name`, `customer_email`, `customer_phone`, `total`, `order_status`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?)";
      const orderValues = [
        orderData.customer_name,
        orderData.customer_email,
        orderData.customer_phone,
        orderData.total,
        orderData.order_status,
        orderData.timestamp,
      ];

      connection.query(
        insertOrderQuery,
        orderValues,
        (orderErr, orderResult) => {
          if (orderErr) {
            return connection.rollback(() => {
              connection.release();
              console.error("Orders insert failed:", orderErr);
              res.status(500).json({ error: "Order header creation failed" });
            });
          }

          const newOrderId = orderResult.insertId;

          let itemsSuccessful = 0;

          itemsDetails.forEach((item) => {
            const insertDetailsQuery =
              "INSERT INTO OrderDetails (`order_id`, `item_id`, `quantity`, `price_at_order`, `item_status`) VALUES (?, ?, ?, ?, ?)";
            const itemValues = [
              newOrderId,
              item.item_id,
              item.quantity,
              item.price_at_order,
              "Pending",
            ];

            connection.query(insertDetailsQuery, itemValues, (detailErr) => {
              if (detailErr) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("OrderDetails insert failed:", detailErr);
                  res.status(500).json({
                    error: "One or more item details failed to save.",
                  });
                });
              }

              itemsSuccessful++;

              if (itemsSuccessful === itemsDetails.length) {
                connection.commit((commitErr) => {
                  if (commitErr) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Transaction commit failed:", commitErr);
                      res
                        .status(500)
                        .json({ error: "Failed to finalize the order." });
                    });
                  }

                  connection.release();
                  return res.status(201).json({
                    message: "Order has been created successfully",
                    order_id: newOrderId,
                  });
                });
              }
            });
          });
        }
      );
    });
  });
});

app.listen(8800, () => {
  console.log("Connected to backend!");
});
