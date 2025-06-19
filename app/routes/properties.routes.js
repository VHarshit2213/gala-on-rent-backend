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
    authenticate,
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
  router.delete(
    "/deleteProperty/:PropertyId",authenticate, product.deleteProperty
  );
  router.put(
    "/editProperty/:PropertyId",Upload_Image,authenticate, product.editProperty
  );
  router.get(
    "/getAllProperties", product.getAllProperties
  );
  router.get(
    "/getAllTokenWiseProperties",authenticate, product.getAllTokenWiseProperties
  );
  // router.get(
  //   "/getProductsByCategory", product.getProductsByCategory
  // );
  router.get(
    "/getProperty/:PropertyId",authenticate, product.getProperty
  );

  app.use("/api/properties", router);
};
