const express = require('express');
const router = express.Router();
const { getPosts, createPost, getPostById, updatePost, deletePost } = require('../controllers/postController');

router.route('/').get(getPosts).post(createPost);
router.route('/:id').get(getPostById).put(updatePost).delete(deletePost);

module.exports = router;