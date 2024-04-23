const express = require("express");
const { getStudents, createStudent, updateStudent } = require("../controllers/studentController");

const router = express.Router();

router.post("/", createStudent);
router.get("/", getStudents);
router.put("/:id", updateStudent);
module.exports = router;
