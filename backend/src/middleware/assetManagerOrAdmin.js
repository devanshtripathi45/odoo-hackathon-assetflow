function assetManagerOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "ASSET_MANAGER")) {
    return res.status(403).json({ error: "Admin or Asset Manager access required" });
  }
  next();
}

module.exports = assetManagerOrAdmin;
