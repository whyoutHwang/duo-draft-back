const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");

// MongoDB 클라이언트 초기화 (DB 연결 설정)
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("duo-draft-database");
const studentsCollection = db.collection("student");

exports.getStudents = async (req, res) => {
  const teacherId = req.query.teacherId; // 쿼리 파라미터에서 teacherId 추출
  console.log(teacherId);
  try {
    const students = await studentsCollection
      .find({ teacherId: teacherId })
      .toArray();
    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "이 교사에게 할당된 학생이 없습니다." });
    }
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({
      message: "학생 정보를 조회하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};
