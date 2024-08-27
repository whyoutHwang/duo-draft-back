const express = require("express");
const router = express.Router();
const upload = require("../uploadMiddleware");
const {
  getPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
} = require("../controllers/postController");

// 게시물 목록 조회
router.get("/", getPosts);

// 게시물 생성 (이미지 업로드 포함)
router.post("/", upload.array("images", 10), createPost);

// 특정 게시물 조회
router.get("/:id", getPostById);

// 게시물 수정 (이미지 업로드 포함)
router.put("/:id", upload.array("images", 10), updatePost);

// 게시물 삭제
router.delete("/:id", deletePost);

// 게시물 이미지만 업로드하는 별도의 라우트
router.post("/upload-images", (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    res.json({ location: req.file.location });
  });
});
module.exports = router;
