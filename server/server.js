require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

const Database = require("./database");
const db = new Database();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


//==========
// المستندات
//==========

app.get("/vouchers", (req, res) => {
  const { title } = req.query;
  db.getVouchers()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/vouchers/:id", (req, res) => {
  const { id } = req.params;
  db.getVoucherById(id)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(404).send(err);
    });
});

app.get("/vouchers/:code", (req, res) => {
  const { code } = req.params;
  db.getVoucherByCode(code)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(404).send(err);
    });
});

app.get("/vouchers/:status", (req, res) => {
  const { status } = req.params;
  db.getVouchersByStatus(status)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(404).send(err);
    });
});

app.post("/vouchers", (req, res) => {
  const body = req.body;
  db.addVoucher(body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.put("/vouchers/:id", (req, res) => {
  db.updateVoucher(req.body)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Voucher not found: ${req.body["-id"]}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.delete("/vouchers/:id", (req, res) => {
  const { id } = req.params;
  db.deleteVoucher(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Voucher not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/vouchers/search/:query", (req, res) => {
  const { query } = req.params;
  db.searchVouchers(query)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.get("/vouchers/date-range", (req, res) => {
  const { startDate, endDate } = req.query;
  db.getVouchersByDateRange(startDate, endDate)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

///////////////////////////////////////////////////////////////

app.get("/settings", (req, res) => {
  db.getSettings()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.post("/settings", (req, res) => {
  const body = req.body;
  db.updateSettings(body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.put("/settings", (req, res) => {
  const body = req.body;
  db.updateSettings(body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.put("/settings/reset", (req, res) => {
  db.resetSettings()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

//==========
// الصيانة
//==========
app.get("/customers", (req, res) => {
  db.getCustomers()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/customers/:id", (req, res) => {
  const { id } = req.params;
  db.getCustomerById(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Customer not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/customers", (req, res) => {
  const body = req.body;
  db.addCustomer(body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.put("/customers/:id", (req, res) => {
  const { id } = req.params;
  db.updateCustomer(req.body)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Customer not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.delete("/customers/:id", (req, res) => {
  const { id } = req.params;
  db.deleteCustomer(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Customer not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});
///////////////////////////////////////////////
app.get("/inventory", (req, res) => {
  db.getInventoryItems()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/inventory/:id", (req, res) => {
  const { id } = req.params;
  db.getInventoryItemById(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Inventory item not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.post("/inventory", (req, res) => {
  const body = req.body;
  db.addInventoryItem(body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.put("/inventory/:id", (req, res) => {
  const { id } = req.params;
  db.updateInventoryItem(req.body)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Inventory item not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.delete("/inventory/:id", (req, res) => {
  const { id } = req.params;
  db.deleteInventoryItem(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Inventory item not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});
////////////////////////////////////////////////

// Technician Routes
app.post("/technicians", (req, res) => {
  const body = req.body;
  db.addTechnician(body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/technicians", (req, res) => {
  db.getTechnicians()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/technicians/:id", (req, res) => {
  const { id } = req.params;
  db.getTechnicianById(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Technician not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.put("/technicians/:id", (req, res) => {
  const { id } = req.params;
  db.updateTechnician(req.body)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Technician not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.delete("/technicians/:id", (req, res) => {
  const { id } = req.params;
  db.deleteTechnician(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Technician not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});
/////////////////////////////////////////

// Order Routes
app.post("/orders", (req, res) => {
  const body = req.body;
  db.createOrder(body)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/orders", (req, res) => {
  db.getOrders()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/orders/:id", (req, res) => {
  const { id } = req.params;
  db.getOrderById(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Order not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.put("/orders/:id", (req, res) => {
  const { id } = req.params;
  const order = { ...req.body, _id: id };
  db.updateOrder(order)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Order not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

app.delete("/orders/:id", (req, res) => {
  const { id } = req.params;
  db.deleteOrder(id)
    .then((data) => {
      if (!data) {
        res.status(404).send(`Order not found: ${id}`);
      }
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

//==========
// الاسعار
//==========

app.post("/clients", (req, res) => {
  const body = req.body;
  db.addClient(body)
    .then((data) => {
      res.status(201).send(data);
    })
    .catch((err) => {
      res
        .status(400)
        .send({ error: "Failed to add client", message: err.message });
    });
});

app.get("/clients", (req, res) => {
  const { email } = req.query;
  if (email) {
    db.getClientsByEmail(email)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res
          .status(500)
          .send({ error: "Failed to fetch clients", message: err.message });
      });
  } else {
    db.getClients()
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res
          .status(500)
          .send({ error: "Failed to fetch clients", message: err.message });
      });
  }
});

app.get("/clients/:id", (req, res) => {
  const { id } = req.params;
  db.getClientByID(id)
    .then((data) => {
      if (!data) {
        return res.status(404).send({ error: `Client not found: ${id}` });
      }
      res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({ error: "Failed to fetch client", message: err.message });
    });
});

app.get("/clients/:email", (req, res) => {
  const { email } = req.params;
  db.getClientsByEmail(email)
    .then((data) => {
      if (!data || data.length === 0) {
        return res
          .status(404)
          .send({ error: `No clients found with email: ${email}` });
      }
      res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({
          error: "Failed to fetch clients by email",
          message: err.message,
        });
    });
});

app.put("/clients/:id", (req, res) => {
  const { id } = req.params;
  const body = req.body;
  db.updateClient({ ...body, _id: id })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ error: `Client not found: ${id}` });
      }
      res.send(data);
    })
    .catch((err) => {
      res
        .status(400)
        .send({ error: "Failed to update client", message: err.message });
    });
});

app.delete("/clients/:id", (req, res) => {
  const { id } = req.params;
  db.deleteClientById(id)
    .then((data) => {
      if (!data) {
        return res.status(404).send({ error: `Client not found: ${id}` });
      }
      res.send({ message: "Client deleted successfully" });
    })
    .catch((err) => {
      res
        .status(500)
        .send({ error: "Failed to delete client", message: err.message });
    });
});

// ... existing code ...


//==========
// المنتجات
//==========

app.post('/products', (req, res) => {
    const body = req.body;
    db.addProduct(body)
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(400).send({ error: "Failed to add product", message: err.message });
        });
});

app.get('/products', (req, res) => {
    const { productCode } = req.query;
    db.getProducts()
        .then(data => {
            if (productCode) {
                data = data.filter(product => product.productCode === productCode);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to fetch products", message: err.message });
        });
});

app.get('/products/:id', (req, res) => {
    const { id } = req.params;
    db.getProductByID(id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Product not found: ${id}` });
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to fetch product", message: err.message });
        });
});

app.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;
    db.updateProduct({ ...body, _id: id })
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Product not found: ${id}` });
            }
            res.send(data);
        })
        .catch(err => {
            res.status(400).send({ error: "Failed to update product", message: err.message });
        });
});

app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    db.deleteProductById(id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Product not found: ${id}` });
            }
            res.send({ message: "Product deleted successfully" });
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to delete product", message: err.message });
        });
});
///////////////////////////////////
// Currency Routes
app.post('/currencies', (req, res) => {
    const body = req.body;
    db.addCurrency(body)
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(400).send({ error: "Failed to add currency", message: err.message });
        });
});

app.get('/currencies', (req, res) => {
    db.getCurrencies()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to fetch currencies", message: err.message });
        });
});

app.get('/currencies/:id', (req, res) => {
    const { id } = req.params;
    db.getCurrencyByID(id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Currency not found: ${id}` });
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to fetch currency", message: err.message });
        });
});

app.put('/currencies/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;
    db.updateCurrency({ ...body, _id: id })
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Currency not found: ${id}` });
            }
            res.send(data);
        })
        .catch(err => {
            res.status(400).send({ error: "Failed to update currency", message: err.message });
        });
});

app.delete('/currencies/:id', (req, res) => {
    const { id } = req.params;
    db.deleteCurrencyById(id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Currency not found: ${id}` });
            }
            res.send({ message: "Currency deleted successfully" });
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to delete currency", message: err.message });
        });
});
///////////////////////////////////////////////
// Rule Routes
app.post('/rules', (req, res) => {
    const body = req.body;
    db.addRule(body)
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(400).send({ error: "Failed to add rule", message: err.message });
        });
});

app.get('/rules', (req, res) => {
    db.getRules()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to fetch rules", message: err.message });
        });
});

app.get('/rules/:id', (req, res) => {
    const { id } = req.params;
    db.getRuleByID(id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Rule not found: ${id}` });
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to fetch rule", message: err.message });
        });
});

app.put('/rules/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;
    db.updateRule({ ...body, _id: id })
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Rule not found: ${id}` });
            }
            res.send(data);
        })
        .catch(err => {
            res.status(400).send({ error: "Failed to update rule", message: err.message });
        });
});

app.delete('/rules/:id', (req, res) => {
    const { id } = req.params;
    db.deleteRuleById(id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Rule not found: ${id}` });
            }
            res.send({ message: "Rule deleted successfully" });
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to delete rule", message: err.message });
        });
});
///////////////////////////////////////////////
// Show Routes
app.post('/shows', (req, res) => {
    const body = req.body;
    db.addShow(body)
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(400).send({ error: "Failed to add show", message: err.message });
        });
});

app.get('/shows', (req, res) => {
    const { id } = req.query;
    db.getShows()
        .then(data => {
            if (id) {
                data = data.filter(show => show._id === id);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to fetch shows", message: err.message });
        });
});

app.get('/shows/:id', (req, res) => {
    const { id } = req.params;
    db.getShowByID(id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Show not found: ${id}` });
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to fetch show", message: err.message });
        });
});

app.put('/shows/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;
    db.updateShow({ ...body, _id: id })
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Show not found: ${id}` });
            }
            res.send(data);
        })
        .catch(err => {
            res.status(400).send({ error: "Failed to update show", message: err.message });
        });
});

app.delete('/shows/:id', (req, res) => {
    const { id } = req.params;
    db.deleteShowById(id)
        .then(data => {
            if (!data) {
                return res.status(404).send({ error: `Show not found: ${id}` });
            }
            res.send({ message: "Show deleted successfully" });
        })
        .catch(err => {
            res.status(500).send({ error: "Failed to delete show", message: err.message });
        });
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server has started on port ${port}...`);
  db.connect();
}); // Start the server on port 3000
