const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb"); // ObjectId를 사용하기 위해

// MongoDB 클라이언트 초기화 (DB 연결 설정)
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("duo-draft-database");
const studentsCollection = db.collection("students");

exports.getStudents = async (req, res) => {
  const teacherId = req.query.teacherId;

  try {
    const students = await studentsCollection
      .find({ teacher_id: new ObjectId(teacherId) })
      .toArray();

    res.status(200).json(students);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "학생 정보를 조회하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};
exports.createStudent = async (req, res) => {
  const { name, gender, teacherId, favoriteFriend, foughtFriend } = req.body;
  const imageUrl = req.file ? req.file.location : "";

  try {
    const result = await studentsCollection.insertOne({
      name,
      gender,
      teacher_id: new ObjectId(teacherId),
      favorite_friend: favoriteFriend,
      fought_friend: foughtFriend,
      imageUrl,
    });

    const student = await studentsCollection.findOne({
      _id: result.insertedId,
    });
    res.status(201).json(student);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "학생 정보를 등록하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, gender, teacherId, favoriteFriend, foughtFriend, imageUrl } =
    req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "유효하지 않은 학생 ID입니다.",
    });
  }

  try {
    const updateData = {
      name,
      gender,
      teacher_id: new ObjectId(teacherId),
      favorite_friend: favoriteFriend,
      fought_friend: foughtFriend,
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    const result = await studentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "학생을 찾을 수 없습니다.",
      });
    }

    const updatedStudent = await studentsCollection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "학생 정보를 업데이트하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};
