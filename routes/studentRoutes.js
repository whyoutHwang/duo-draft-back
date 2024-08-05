const express = require("express");
const upload = require("../uploadMiddleware");
const {
  getStudents,
  createStudent,
  updateStudent,
  createStudentsBatch,
} = require("../controllers/studentController");

const router = express.Router();

router.get(
  "/",
  (req, res, next) => {
    console.log("GET /api/students");
    next();
  },
  getStudents
);

router.post(
  "/",
  upload.single("image"),
  (req, res, next) => {
    console.log("POST /api/students");
    next();
  },
  createStudent
);

router.put(
  "/:id",
  upload.single("image"),
  (req, res, next) => {
    console.log("PUT /api/students/:id");
    next();
  },
  updateStudent
);

router.post("/upload", upload.single("image"), (req, res) => {
  console.log("POST /api/students/upload");
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).json({ location: req.file.location });
});

router.post("/batch", createStudentsBatch);

module.exports = router;
