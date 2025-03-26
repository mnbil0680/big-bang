//////////////////////////////////////////////////////////////////
// Client
////////////

// Create POST API to create a new Client
app.post("/clients", async (req, res) => {
  try {
    const body = req.body;
    console.log("BODY:", body);
    const data = await db.addClient(body);
    res.status(201).send(data); // 201 for resource creation
  } catch (err) {
    res
      .status(400)
      .send({ error: "Failed to add client", message: err.message });
  }
});

// GET API to get all clients or filter by email
app.get("/clients", async (req, res) => {
  try {
    const { email } = req.query;
    let data;
    if (email) {
      data = await db.getClientsByEmail(email);
    } else {
      data = await db.getClients();
    }
    console.log("DATA:", data);
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch clients", message: err.message });
  }
});

// GET API by ID to get a specific client
app.get("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.getClientByID(id);
    if (!data) {
      return res.status(404).send({ error: `Client not found: ${id}` });
    }
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch client", message: err.message });
  }
});

// PUT API to update a specific client
app.put("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = await db.updateClient({ ...body, _id: id }); // Use _id instead of -id
    if (!data) {
      return res.status(404).send({ error: `Client not found: ${id}` });
    }
    res.send(data);
  } catch (err) {
    res
      .status(400)
      .send({ error: "Failed to update client", message: err.message });
  }
});

// DELETE API by ID to delete a specific client
app.delete("/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.deleteClientById(id);
    if (!data) {
      return res.status(404).send({ error: `Client not found: ${id}` });
    }
    res.send({ message: "Client deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to delete client", message: err.message });
  }
});

//////////////////////////////////////////////////////////////////
// Product
/////////////

// Create POST API to create a new Product
app.post("/products", async (req, res) => {
  try {
    const body = req.body;
    console.log("product BODY:", body);
    const data = await db.addProduct(body);
    res.status(201).send(data); // 201 for resource creation
  } catch (err) {
    console.log("product ERROR:", err);
    res
      .status(400)
      .send({ error: "Failed to add product", message: err.message });
  }
});

// GET API to get all products or filter by productCode
app.get("/products", async (req, res) => {
  try {
    const { productCode } = req.query;
    let data = await db.getProducts();
    if (productCode) {
      data = data.filter((product) => product.productCode === productCode);
    }
    console.log("DATA:", data);
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch products", message: err.message });
  }
});

// GET API by ID to get a specific product
app.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.getProductByID(id);
    if (!data) {
      return res.status(404).send({ error: `Product not found: ${id}` });
    }
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch product", message: err.message });
  }
});

// PUT API to update a specific product
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = await db.updateProduct({ ...body, _id: id }); // Use _id instead of -id
    if (!data) {
      return res.status(404).send({ error: `Product not found: ${id}` });
    }
    res.send(data);
  } catch (err) {
    res
      .status(400)
      .send({ error: "Failed to update product", message: err.message });
  }
});

// DELETE API by ID to delete a specific product
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.deleteProductById(id);
    if (!data) {
      return res.status(404).send({ error: `Product not found: ${id}` });
    }
    res.send({ message: "Product deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to delete product", message: err.message });
  }
});

//////////////////////////////////////////////////////////////////
// Currency
/////////////

// Create POST API to create a new Currency
app.post("/currencies", async (req, res) => {
  try {
    const body = req.body;
    console.log("BODY:", body);
    const data = await db.addCurrency(body);
    res.status(201).send(data); // 201 for resource creation
  } catch (err) {
    res
      .status(400)
      .send({ error: "Failed to add currency", message: err.message });
  }
});

// GET API to get all currencies or filter by id
app.get("/currencies", async (req, res) => {
  try {
    const { id } = req.query;
    let data = await db.getCurrencies();
    if (id) {
      data = data.filter((currency) => currency._id === id);
    }
    console.log("DATA:", data);
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch currencies", message: err.message });
  }
});

// PUT API to update a specific currency
app.put("/currencies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = await db.updateCurrency({ ...body, _id: id }); // Use _id instead of -id
    if (!data) {
      return res.status(404).send({ error: `Currency not found: ${id}` });
    }
    res.send(data);
  } catch (err) {
    res
      .status(400)
      .send({ error: "Failed to update currency", message: err.message });
  }
});

// DELETE API by ID to delete a specific currency
app.delete("/currencies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.deleteCurrencyById(id);
    if (!data) {
      return res.status(404).send({ error: `Currency not found: ${id}` });
    }
    res.send({ message: "Currency deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to delete currency", message: err.message });
  }
});

//////////////////////////////////////////////////////////////////
// Rules
////////////

// Create POST API to create a new Rule
app.post("/rules", async (req, res) => {
  try {
    const body = req.body;
    console.log("BODY:", body);
    const data = await db.addRule(body);
    res.status(201).send(data); // 201 for resource creation
  } catch (err) {
    res.status(400).send({ error: "Failed to add rule", message: err.message });
  }
});

// GET API to get all rules or filter by id
app.get("/rules", async (req, res) => {
  try {
    const { id } = req.query;
    let data = await db.getRules();
    if (id) {
      data = data.filter((rule) => rule._id === id);
    }
    console.log("DATA:", data);
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch rules", message: err.message });
  }
});

// PUT API to update a specific rule
app.put("/rules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = await db.updateRule({ ...body, _id: id }); // Use _id instead of -id
    if (!data) {
      return res.status(404).send({ error: `Rule not found: ${id}` });
    }
    res.send(data);
  } catch (err) {
    res
      .status(400)
      .send({ error: "Failed to update rule", message: err.message });
  }
});

// DELETE API by ID to delete a specific rule
app.delete("/rules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.deleteRuleById(id);
    if (!data) {
      return res.status(404).send({ error: `Rule not found: ${id}` });
    }
    res.send({ message: "Rule deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to delete rule", message: err.message });
  }
});

//////////////////////////////////////////////////////////////////
// Shows
////////////

// Create POST API to create a new Show
app.post("/shows", async (req, res) => {
  try {
    const body = req.body;
    console.log("BODY:", body);
    const data = await db.addShow(body);
    res.status(201).send(data); // 201 for resource creation
  } catch (err) {
    console.log("ERROR:", err);
    res.status(400).send({ error: "Failed to add show", message: err.message });
  }
});

// GET API to get all shows or filter by id
app.get("/shows", async (req, res) => {
  try {
    const { id } = req.query;
    let data = await db.getShows();
    if (id) {
      data = data.filter((show) => show._id === id);
    }
    console.log("DATA:", data);
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch shows", message: err.message });
  }
});

// GET API by ID to get a specific show
app.get("/shows/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.getShowByID(id);
    if (!data) {
      return res.status(404).send({ error: `Show not found: ${id}` });
    }
    res.send(data);
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch show", message: err.message });
  }
});

// PUT API to update a specific show
app.put("/shows/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const data = await db.updateShow({ ...body, _id: id }); // Use _id instead of -id
    if (!data) {
      return res.status(404).send({ error: `Show not found: ${id}` });
    }
    res.send(data);
  } catch (err) {
    res
      .status(400)
      .send({ error: "Failed to update show", message: err.message });
  }
});

// DELETE API by ID to delete a specific show
app.delete("/shows/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await db.deleteShowById(id);
    if (!data) {
      return res.status(404).send({ error: `Show not found: ${id}` });
    }
    res.send({ message: "Show deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to delete show", message: err.message });
  }
});

//////////////////////////////////////////////////////////////////

