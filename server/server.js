require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

const Database = require('./database');
const db = new Database();



app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));
//==========
// المستندات
//==========

app.get('/vouchers', (req, res) => {
    const {title } = req.query;
        db.getVouchers().then(data =>{
            res.send(data);
        }).catch(err =>{
            res.status(500).send(err);
        });
});

app.get('/vouchers/:id', (req, res) => {
    const { id } = req.params;
    db.getVoucherById(id)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(404).send(err);
        });
});

app.get('/vouchers/:code', (req, res) => {
    const { code } = req.params;
    db.getVoucherByCode(code)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(404).send(err);
        });
});

app.get('/vouchers/:status', (req, res) => {
    const { status } = req.params;
    db.getVouchersByStatus(status)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(404).send(err);
        });
});

app.post('/vouchers', (req, res) =>{
    const body = req.body;
    db.addVoucher(body).then(data =>{
        res.send(data);
    }).catch(err =>{
        res.status(500).send(err);
    });
}); 

app.put('/vouchers/:id', (req, res) => {
    db.updateVoucher(req.body)
        .then(data => {
            if(!data){
                res.status(404).send(`Voucher not found: ${req.body["-id"]}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

app.delete('/vouchers/:id', (req, res) => {
    const { id } = req.params;
    db.deleteVoucher(id)
    .then(data =>{
        if(!data){
            res.status(404).send(`Voucher not found: ${id}`);
        }
        res.send(data);
    }).catch(err =>{
        res.status(500).send(err);
    });
});

app.get('/vouchers/search/:query', (req, res) => {
    const { query } = req.params;
    db.searchVouchers(query)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

app.get('/vouchers/date-range', (req, res) => {
    const { startDate, endDate } = req.query;
    db.getVouchersByDateRange(startDate, endDate)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

///////////////////////////////////////////////////////////////


app.get('/settings', (req, res) => {
    db.getSettings()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

app.post('/settings', (req, res) => {
    const body = req.body;
    db.updateSettings(body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

app.put('/settings', (req, res) => {
    const body = req.body;
    db.updateSettings(body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

app.put('/settings/reset', (req, res) => {
    db.resetSettings()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

//==========
// الصيانة
//==========
app.get('/customers', (req, res) => {
    db.getCustomers()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.get('/customers/:id', (req, res) => {
    const { id } = req.params;
    db.getCustomerById(id)
        .then(data => {
            if(!data) {
                res.status(404).send(`Customer not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.post('/customers', (req, res) => {
    const body = req.body;
    db.addCustomer(body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.put('/customers/:id', (req, res) => {
    const { id } = req.params;
    db.updateCustomer(req.body)
        .then(data => {
            if(!data) {
                res.status(404).send(`Customer not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

app.delete('/customers/:id', (req, res) => {
    const { id } = req.params;
    db.deleteCustomer(id)
        .then(data => {
            if(!data) {
                res.status(404).send(`Customer not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});
///////////////////////////////////////////////
app.get('/inventory', (req, res) => {
    db.getInventoryItems()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.get('/inventory/:id', (req, res) => {
    const { id } = req.params;
    db.getInventoryItemById(id)
        .then(data => {
            if(!data) {
                res.status(404).send(`Inventory item not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.post('/inventory', (req, res) => {
    const body = req.body;
    db.addInventoryItem(body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.put('/inventory/:id', (req, res) => {
    const { id } = req.params;
    db.updateInventoryItem(req.body)
        .then(data => {
            if(!data) {
                res.status(404).send(`Inventory item not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

app.delete('/inventory/:id', (req, res) => {
    const { id } = req.params;
    db.deleteInventoryItem(id)
        .then(data => {
            if(!data) {
                res.status(404).send(`Inventory item not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});
////////////////////////////////////////////////
// Order Routes
app.post('/orders', (req, res) => {
    const body = req.body;
    db.createOrder(body)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.get('/orders', (req, res) => {
    db.getOrders()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.get('/orders/:id', (req, res) => {
    const { id } = req.params;
    db.getOrderById(id)
        .then(data => {
            if(!data) {
                res.status(404).send(`Order not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

app.put('/orders/:id', (req, res) => {
    const { id } = req.params;
    const order = { ...req.body, _id: id };
    db.updateOrder(order)
        .then(data => {
            if(!data) {
                res.status(404).send(`Order not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

app.delete('/orders/:id', (req, res) => {
    const { id } = req.params;
    db.deleteOrder(id)
        .then(data => {
            if(!data) {
                res.status(404).send(`Order not found: ${id}`);
            }
            res.send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});






const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server has started on port ${port}...`);
    db.connect();
}); // Start the server on port 3000