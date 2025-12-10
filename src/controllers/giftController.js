class GiftController {
  static async home(req, res, next) {
    try {
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
module.exports = GiftController;
