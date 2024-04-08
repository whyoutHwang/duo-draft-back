const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");

// MongoDB 클라이언트 초기화 (DB 연결 설정)
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("duo-draft-database");
const usersCollection = db.collection("user");

exports.signUp = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 이메일 중복 검사
    const existingUser = await usersCollection.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 정보 저장
    const result = await usersCollection.insertOne({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({
      message: "회원 가입 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

exports.signIn = async (req, res) => {
  // 로그인 로직
  const { email, password } = req.body;
  const user = await usersCollection.findOne({ email: email });

  if (!user) {
    return res.status(400).json({ message: "잘못된 이메일입니다." });
  }

  if (await bcrypt.compare(password, user.password)) {
    res.status(200).json({ message: "로그인 성공!", userId: user._id });
  } else {
    res.status(400).json({ message: "잘못된 비밀번호입니다." });
  }
};
