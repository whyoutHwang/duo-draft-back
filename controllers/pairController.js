const { MongoClient } = require("mongodb");

// MongoDB 클라이언트 초기화 (DB 연결 설정)
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("duo-draft-database");
const pairCollection = db.collection("pair_history");

const { ObjectId } = require("mongodb");

exports.getPairHistory = async (req, res) => {
  try {
    console.log("getPairHistory");
    const teacherId = new ObjectId(req.params.teacherId);

    const pairHistory = await pairCollection
      .find({ teacher_id: teacherId })
      .sort({ date: -1 })
      .limit(1)
      .toArray();

    if (pairHistory.length === 0) {
      return res
        .status(404)
        .json({ error: "No pair history found for the teacher" });
    }

    res.json(pairHistory[0]);
  } catch (error) {
    console.error("Failed to fetch pair history:", error);
    res.status(500).json({ error: "Failed to fetch pair history" });
  }
};

exports.savePairHistory = async (req, res) => {
  try {
    const { teacherId, pairs } = req.body;

    await pairCollection.insertOne({
      teacher_id: teacherId,
      pairs: pairs,
      date: new Date(),
      shuffle_number: 1,
    });

    res.sendStatus(201);
  } catch (error) {
    console.error("Failed to save pair history:", error);
    res.status(500).json({ error: "Failed to save pair history" });
  }
};
