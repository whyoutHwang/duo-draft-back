const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");

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
    res.status(200).json({
      message: "로그인 성공!",
      user: user,
    });
  } else {
    res.status(400).json({ message: "잘못된 비밀번호입니다." });
  }
};

exports.getTeacherInfo = async (req, res) => {
  try {
    const teacherId = req.params.id; // URL 파라미터로 교사 ID를 받는다고 가정
    const teacher = await usersCollection.findOne({
      _id: new ObjectId(teacherId),
    });

    if (!teacher) {
      return res.status(404).json({ message: "선생님을 찾을 수 없습니다." });
    }

    // 비밀번호 정보는 제외하고 반환
    const { password, ...teacherInfo } = teacher;
    console.log(teacherInfo);
    res.status(200).json(teacherInfo);
  } catch (error) {
    res.status(500).json({
      message: "선생님 정보를 가져오는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

exports.getTeacherInfo = async (req, res) => {
  try {
    const teacherId = req.params.id;
    const teacher = await usersCollection.findOne({
      _id: new ObjectId(teacherId),
    });

    if (!teacher) {
      return res.status(404).json({ message: "선생님을 찾을 수 없습니다." });
    }

    const { password, ...teacherInfo } = teacher;
    res.status(200).json(teacherInfo);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "선생님 정보를 가져오는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

exports.updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, classInfo } = req.body;
  const imageUrl = req.file ? req.file.location : req.body.imageUrl;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "유효하지 않은 선생님 ID입니다.",
    });
  }

  try {
    const updateData = {
      name,
      classInfo,
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "선생님을 찾을 수 없습니다.",
      });
    }

    const updatedTeacher = await usersCollection.findOne({
      _id: new ObjectId(id),
    });

    const { password, ...teacherInfo } = updatedTeacher;
    res.status(200).json(teacherInfo);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "선생님 정보를 업데이트하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};
