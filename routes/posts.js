const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const multer  = require('multer')
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier')


// create a post
const upload = multer();
router.post("/", upload.single('img'), async (req, res) => {
    
    try {

        let imageUrl = null

        if(req.file){
            imageUrl = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { stream: true },
                    (error, result) => {
                        if (error) {
                            console.log("Error occurred during upload");
                            reject(error);
                            return;
                        }

                        resolve(result.secure_url);
                    }
                ).end(req.file.buffer);
            });
        }
        
        const newPost = new Post({
            userId: req.body.userId,
            desc: req.body.desc,
            img: imageUrl,
            likes: []
        })

    
        const savedPost = await (await newPost.save()).populate("userId", "username profilePicture");
        res.status(200).json(savedPost);

    
    } catch (err) {
        console.error('Error while creating post:', err);
        res.status(500).json({ error: 'Server error' });
    }
})


// update a post
router.put("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if(post.userId === req.body.userId) {
            await post.updateOne({$set: req.body});
            res.status(200).json("the post has been updated");
        } else {
            res.status(403).json("you can update only your post")
        }

    } catch (err) {
        res.status(500).json(err)
    }
})

// delete a post
router.delete("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if(post.userId === req.body.userId) {
            await post.deleteOne();
            res.status(200).json("the post has been deleted");
        } else {
            res.status(403).json("you can delete only your post")
        }

    } catch (err) {
        res.status(500).json(err)
    }
})


// like / dislike a post
router.put("/:id/like", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: { likes: req.body.userId } });
            res.status(200).json("The post has been liked")
        } else {
            await post.updateOne({ $pull: { likes: req.body.userId } });
            res.status(200).json("The post has been disliked");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// get a post
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json("post not found")
        }
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }
})


// get timeline posts
router.get("/timeline/:username", async (req, res) => {
    try {
        const currentUser = await User.findOne({username: req.params.username});
        
        const userPosts = await Post.find({ userId: currentUser._id })
        .sort({ createdAt: -1 })
        .populate("userId", "username profilePicture")

        res.status(200).json(userPosts)
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
})

// get newsfeed posts
router.get("/newsfeed/:userId", async (req, res) => {
    try {
        const currentUser = await User.findById(req.params.userId);
        
        const userPosts = await Post.find({ userId: currentUser._id })
        .sort({ createdAt: -1 })
        .populate("userId", "username profilePicture")
        
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({ userId: friendId })
                .sort({ createdAt: -1 })
                .populate("userId", "username profilePicture");
            })
        )

        res.status(200).json(userPosts.concat(...friendPosts))
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
})

module.exports  = router