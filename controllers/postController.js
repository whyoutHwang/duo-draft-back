const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("duo-draft-database");
const postsCollection = db.collection("posts");

// 모든 게시글 가져오기
exports.getPosts = async (req, res) => {
  try {
    const { postType, searchTerm, page = 1, limit = 10 } = req.query;
    let query = {};
    console.log(postType, searchTerm);

    if (postType && postType !== "전체") {
      query.postType = postType;
    }

    if (searchTerm) {
      query.title = { $regex: searchTerm, $options: "i" }; // 'i'는 대소문자 구분 없이 검색
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalPosts = await postsCollection.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    const posts = await postsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    res.status(200).json({
      posts,
      currentPage: parseInt(page),
      totalPages,
      totalPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "게시글을 조회하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

// 새 게시글 생성
exports.createPost = async (req, res) => {
  const { postType, title, content, teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({
      message: "teacherId는 필수 항목입니다.",
    });
  }

  try {
    const result = await postsCollection.insertOne({
      postType,
      title,
      content,
      teacher_id: new ObjectId(teacherId),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newPost = await postsCollection.findOne({ _id: result.insertedId });
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "게시글을 생성하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

// ID로 특정 게시글 가져오기
exports.getPostById = async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "유효하지 않은 게시글 ID입니다.",
    });
  }

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(id) });

    if (!post) {
      return res.status(404).json({
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "게시글을 조회하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

// 게시글 수정
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { postType, title, content, teacherId } = req.body;

  if (!ObjectId.isValid(id) || !teacherId) {
    return res.status(400).json({
      message: "유효하지 않은 게시글 ID 또는 teacherId입니다.",
    });
  }

  try {
    const result = await postsCollection.updateOne(
      { _id: new ObjectId(id), teacher_id: new ObjectId(teacherId) },
      {
        $set: {
          postType,
          title,
          content,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "게시글을 찾을 수 없거나 수정 권한이 없습니다.",
      });
    }

    const updatedPost = await postsCollection.findOne({
      _id: new ObjectId(id),
    });
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "게시글을 수정하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  if (!ObjectId.isValid(id) || !teacherId) {
    return res.status(400).json({
      message: "유효하지 않은 게시글 ID 또는 teacherId입니다.",
    });
  }

  try {
    const result = await postsCollection.deleteOne({
      _id: new ObjectId(id),
      teacher_id: new ObjectId(teacherId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "게시글을 찾을 수 없거나 삭제 권한이 없습니다.",
      });
    }

    res.status(200).json({
      message: "게시글이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "게시글을 삭제하는 중 에러가 발생했습니다.",
      error: error.message,
    });
  }
};
