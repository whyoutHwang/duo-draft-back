const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcrypt");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URI;
console.log(uri);
const client = new MongoClient(uri);

console.log("Server starting...");

async function run() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB");

    const db = client.db("duo-draft-database");
    const usersCollection = db.collection("user");

    // 회원 가입 라우트
    app.options("/signup", cors());
    app.post("/signup", async (req, res) => {
      const { username, email, password } = req.body;

      console.log(username, email, password);

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        // 사용자 정보 데이터베이스에 저장
        const result = await usersCollection.insertOne({
          username,
          email,
          password: hashedPassword,
        });

        res.status(201).send({
          message: "User created successfully",
          userId: result.insertedId,
        });
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to create user", error: error.message });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } finally {
    // 클라이언트 연결을 여기서 닫지 마세요.
  }
}
run().catch(console.dir);
