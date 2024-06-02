const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb"); // ObjectId를 사용하기 위해

// MongoDB 클라이언트 초기화 (DB 연결 설정)
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("duo-draft-database");
const studentsCollection = db.collection("students");

exports.getStudents = async (req, res) => {
  const teacherId = req.query.teacherId; // 쿼리 파라미터에서 teacherId 추출

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
  const { name, gender, teacherId, favoriteFriend, foughtFriend } = req.body; // 요청에서 학생 정보 추출
  try {
    // 학생 정보를 데이터베이스에 저장
    console.log(req.body);
    const result = await studentsCollection.insertOne({
      name,
      gender,
      teacher_id: new ObjectId(teacherId), // ObjectId로 변환하여 저장
      favorite_friend: favoriteFriend, // 문자열 배열 그대로 저장
      fought_friend: foughtFriend, // 문자열 배열 그대로 저장
    });

    // 새로 생성된 학생의 ID를 사용하여 학생 정보를 다시 조회
    const student = await studentsCollection.findOne({
      _id: result.insertedId,
    });
    console.log(student.teacher_id);
    res.status(201).json(student); // 등록된 학생 정보를 응답으로 반환
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "학생 정보를 등록하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

exports.updateStudent = async (req, res) => {
  const { id } = req.params; // URL 파라미터에서 학생 ID 추출
  const { name, gender, teacherId, favoriteFriend, foughtFriend } = req.body; // 요청에서 학생 정보 추출
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "유효하지 않은 학생 ID입니다.",
    });
  }

  try {
    const result = await studentsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          gender,
          teacher_id: new ObjectId(teacherId),
          favorite_friend: favoriteFriend, // 문자열 배열 그대로 저장
          fought_friend: foughtFriend, // 문자열 배열 그대로 저장
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "학생을 찾을 수 없습니다.",
      });
    }

    // 업데이트된 학생의 ID를 사용하여 학생 정보를 다시 조회
    const updatedStudent = await studentsCollection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json(updatedStudent); // 업데이트된 학생 정보를 응답으로 반환
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "학생 정보를 업데이트하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};
