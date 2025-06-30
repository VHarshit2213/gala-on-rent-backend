const express = require("express");
const bodyParser = require("body-parser"); 
require('dotenv').config();
const app = express();
const jwt = require("jsonwebtoken");
var cors = require("cors");
const db = require("./app/middleware/dbconnection.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.get("/", async (req, res) => {
  res.json({
    message: "gala on rent backend exucuting Successfully",
    status: 1,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`server started port:${process.env.PORT}`);
});

require("./app/routes/users.routes")(app);
require("./app/routes/properties.routes")(app, upload);
require("./app/routes/review.routes")(app, upload);
