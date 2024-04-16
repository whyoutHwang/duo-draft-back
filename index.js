const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./config/db"); // 별도의 DB 설정 파일
const userRoutes = require("./routes/userRoutes"); // 사용자 관련 라우트 처리
const studentRoutes = require("./routes/studentRoutes"); // 학생 라우트 가져오기

// dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

connectDB(); // 데이터베이스 연결

app.use("/api/user", userRoutes); // 사용자 관련 라우트
app.use("/api/students", studentRoutes); // 학생 라우트 설정

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
