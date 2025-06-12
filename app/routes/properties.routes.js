module.exports = (app, upload) => {
  const { check, validationResult } = require("express-validator");
  const product = require("../controllers/properties.controller.js");
  var authenticate = require("../middleware/authenticate.js");
  var router = require("express").Router();
  var Upload_Image = upload.fields([
      { name: "image", maxCount: 10 },
    ]);

    
  router.post(
    "/createProperties",
    Upload_Image,
    [check("property_belongsTo").not().isEmpty().trim().escape()],
    [check("address").not().isEmpty().trim().escape()],
    [check("looking_to").not().isEmpty().trim().escape()],
    [check("Carpet_Area").not().isEmpty().trim().escape()],
    [check("Other_Area").not().isEmpty().trim().escape()],
    [check("Popular_Area").not().isEmpty().trim().escape()],
    [check("type_of_property").not().isEmpty().trim().escape()],
    [check("Property_Suitable_For").not().isEmpty().trim().escape()],
    [check("Type_of_Power").not().isEmpty().trim().escape()],
    [check("Type_of_Water_Supply").not().isEmpty().trim().escape()],
    [check("Number_of_Washroom").not().isEmpty().trim().escape()],
    [check("Financials").not().isEmpty().trim().escape()],
    [check("Amenities").not().isEmpty().trim().escape()],
    product.createProperties
  );
  router.post(
    "/createCustomProduct",
    authenticate,
    product.createCustomProduct
  );
  router.delete(
    "/deleteProduct/:productId", authenticate, product.deleteProduct
  );
  router.put(
    "/editProduct/:productId",Upload_Image,authenticate, product.editProduct
  );
  router.get(
    "/getAllProducts", product.getAllProducts
  );
  router.get(
    "/getProductsByCategory", product.getProductsByCategory
  );
  router.get(
    "/getProduct/:productId", product.getProduct
  );

  app.use("/api/properties", router);
};
