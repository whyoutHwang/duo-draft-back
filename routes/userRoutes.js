const express = require("express");
const upload = require("../uploadMiddleware");
const {
  signUp,
  signIn,
  getTeacherInfo,
  updateTeacher,
} = require("../controllers/userController");

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/teacher/:id", getTeacherInfo);
router.put("/teacher/:id", upload.single("image"), updateTeacher);

// 이미지 업로드만을 위한 별도의 라우트
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).json({ location: req.file.location });
});

module.exports = router;
