module.exports = (app) => {
  app.get("/", function (req, res) {
    res.redirect("https://github.com/MonsieurV/gamma-api");
  });
};
