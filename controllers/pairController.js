const { MongoClient } = require("mongodb");

// MongoDB 클라이언트 초기화 (DB 연결 설정)
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("duo-draft-database");
const pairCollection = db.collection("pair_history");
const studentPairCollection = db.collection("student_pairs");

const { ObjectId } = require("mongodb");

exports.getPairHistory = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.teacherId)) {
      return res.status(400).json({ error: "Invalid teacher ID" });
    }

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

    const pairs = pairHistory[0].pairs;
    const studentIds = pairs
      .flatMap((pair) => [pair.student1._id, pair.student2?._id])
      .filter((id) => id);

    const studentPairHistory = await studentPairCollection
      .find({ student_id: { $in: studentIds.map((id) => new ObjectId(id)) } })
      .toArray();

    const previousPairsMap = new Map();
    studentPairHistory.forEach((record) => {
      previousPairsMap.set(
        record.student_id.toString(),
        record.paired_with.map((id) => id.toString())
      );
    });

    res.json({ pairs, previousPairsMap });
  } catch (error) {
    console.error("Failed to fetch pair history:", error);
    res.status(500).json({ error: "Failed to fetch pair history" });
  }
};

exports.getSelectedPairHistory = async (req, res) => {
  try {
    const { teacherId, historyId } = req.params;

    if (!ObjectId.isValid(teacherId) || !ObjectId.isValid(historyId)) {
      return res
        .status(400)
        .json({ error: "Invalid teacher ID or history ID" });
    }

    const teacherObjId = new ObjectId(teacherId);
    const historyObjId = new ObjectId(historyId);

    const selectedPairHistory = await pairCollection.findOne({
      _id: historyObjId,
      teacher_id: teacherObjId,
    });

    if (!selectedPairHistory) {
      return res
        .status(404)
        .json({ error: "No pair history found for the given IDs" });
    }

    const pairs = selectedPairHistory.pairs;
    const studentIds = pairs
      .flatMap((pair) => [pair.student1._id, pair.student2?._id])
      .filter((id) => id);

    const studentPairHistory = await studentPairCollection
      .find({ student_id: { $in: studentIds.map((id) => new ObjectId(id)) } })
      .toArray();

    const previousPairsMap = new Map();
    studentPairHistory.forEach((record) => {
      previousPairsMap.set(
        record.student_id.toString(),
        record.paired_with.map((id) => id.toString())
      );
    });

    res.json({
      date: selectedPairHistory.date,
      shuffle_number: selectedPairHistory.shuffle_number,
      pairs,
      previousPairsMap: Object.fromEntries(previousPairsMap),
    });
  } catch (error) {
    console.error("Failed to fetch selected pair history:", error);
    res.status(500).json({ error: "Failed to fetch selected pair history" });
  }
};

exports.getPairHistoryList = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.teacherId)) {
      return res.status(400).json({ error: "Invalid teacher ID" });
    }

    const teacherId = new ObjectId(req.params.teacherId);

    const pairHistory = await pairCollection
      .find({ teacher_id: teacherId })
      .sort({ date: -1 })
      .toArray();

    if (pairHistory.length === 0) {
      return res
        .status(404)
        .json({ error: "No pair history found for the teacher" });
    }

    res.status(200).json(pairHistory);
  } catch (error) {
    console.error("Failed to fetch pair history:", error);
    res.status(500).json({ error: "Failed to fetch pair history" });
  }
};

exports.savePairHistory = async (req, res) => {
  try {
    const { teacherId, pairs } = req.body;

    const teacherObjectId = new ObjectId(teacherId);

    await pairCollection.insertOne({
      teacher_id: teacherObjectId,
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
