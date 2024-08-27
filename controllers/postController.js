const { MongoClient, ObjectId } = require("mongodb");
const sanitizeHtml = require("sanitize-html");

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("duo-draft-database");
const postsCollection = db.collection("posts");

// 모든 게시글 가져오기
exports.getPosts = async (req, res) => {
  try {
    const { postType, searchTerm, page = 1, limit = 10 } = req.query;
    let query = {};

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
  const { postType, title, content, teacherId, username } = req.body;
  const images = req.files ? req.files.map((file) => file.location) : [];

  if (!teacherId) {
    return res.status(400).json({
      message: "teacherId는 필수 항목입니다.",
    });
  }

  // HTML 콘텐츠 sanitize
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt"],
    },
  });

  // 콘텐츠 길이 확인 (예: 10000자 제한)
  if (sanitizedContent.length > 10000) {
    return res.status(400).json({
      message: "콘텐츠가 너무 깁니다. 10000자 이내로 작성해주세요.",
    });
  }

  try {
    const result = await postsCollection.insertOne({
      postType,
      username,
      title,
      content: sanitizedContent,
      images, // 이미지 URL 배열 추가
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
// 게시글 수정 (이미지 처리 추가)
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { postType, title, content, teacherId } = req.body;
  const newImages = req.files ? req.files.map((file) => file.location) : [];

  if (!ObjectId.isValid(id) || !teacherId) {
    return res.status(400).json({
      message: "유효하지 않은 게시글 ID 또는 teacherId입니다.",
    });
  }

  // HTML 콘텐츠 sanitize
  const sanitizedContent = sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt"],
    },
  });

  try {
    const existingPost = await postsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingPost) {
      return res.status(404).json({
        message: "게시글을 찾을 수 없습니다.",
      });
    }

    // 기존 이미지와 새 이미지를 합칩니다.
    const updatedImages = [...(existingPost.images || []), ...newImages];

    const result = await postsCollection.updateOne(
      { _id: new ObjectId(id), teacher_id: new ObjectId(teacherId) },
      {
        $set: {
          postType,
          title,
          content: sanitizedContent,
          images: updatedImages, // 업데이트된 이미지 배열
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

// 이미지만 업로드하는 새로운 함수 추가
exports.uploadImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "업로드된 파일이 없습니다." });
  }

  const imageUrls = req.files.map((file) => file.location);

  res.status(200).json({
    message: "이미지가 성공적으로 업로드되었습니다.",
    images: imageUrls,
  });
};
