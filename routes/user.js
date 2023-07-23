const User = require("../models/User")
const router = require("express").Router();

// get a user
router.get("/", async (req, res) => {
    const user_id = req.query.userId;
    const username = req.query.username;

    try{
        const user = user_id ? await User.findById(req.params.id) : await User.findOne({username: username})
        const {password, updatedAt, ...other} = user._doc
        res.status(200).json(other)
    } catch(err) {
        res.status(500).json(err);
    }
})

// get followings of a user
router.get("/friends/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate("followings", "_id username profilePicture");
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(user);
    
        // Extract the followers' information
        const followings = user.followings.map((following) => ({
            _id: following._id,
            username: following.username,
            profilePicture: following.profilePicture,
        }));
    
        res.status(200).json(followings);
    } catch (err) {
        console.log(err);
        return res.status(500).json(err);
    }
})

// update a user
router.put("/:id", async (req, res) => {
    // Todo: update this condition after completing user authentication
    if (req.body.userId === req.params.id || req.body.isAdmin) {
        if (req.body.password) {
            try{
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);     
            } catch(err) {
                console.log(err);
                return res.status(500).json(err);
            }
        }

        try{
            const user = await User.findByIdAndUpdate(req.params.id, {
                $set: req.body,
            });
            res.status(200).json({message: "Account has been updated"})
        } catch(err) {
            console.log(err);
            return res.status(500).json(err);
        }

    } else {
        return res.status(403).json({message: "You can only update your account"})
    }
})



// delete a user
router.delete("/:id", async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
        try {
            await User.findByIdAndDelete({_id: req.params.id});
            res.status(500).json({message: "Account has been deleted"});
        } catch (err) {
            return res.status(500).json(err);
        }
    } else {
        return res.status(403).json({message: "you can delete your account!"});
    }
})

// follow a user
router.put("/:id/follow", async (req, res) => {
    const { id: userId } = req.params;
    const { userId: currentUserId } = req.body;
  
    try {
      // Check if the user is trying to follow themselves
      if (userId === currentUserId) {
        return res.status(403).json({ message: "You cannot follow yourself" });
      }
  
      // Find the user being followed and the current user
      const [followedUser, currentUser] = await Promise.all([
        User.findById(userId),
        User.findById(currentUserId),
      ]);
  
      // Check if the followedUser and currentUser exist
      if (!followedUser || !currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if the currentUser is already following the followedUser
      if (followedUser.followers.includes(currentUserId)) {
        return res
          .status(403)
          .json({ message: "You are already following this user" });
      }
  
      // Update the followedUser's followers and currentUser's followings
      followedUser.followers.push(currentUserId);
      currentUser.followings.push(userId);
  
      await Promise.all([followedUser.save(), currentUser.save()]);
  
      res.status(200).json({ message: "User followed successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

// unfollow a user
router.put("/:id/unfollow", async (req, res) => {
    const {id: unfollowedUserId} = req.params;
    const {userId: currentUserId } = req.body;

    try{
        // Check if the user is trying to follow themselves
        if (unfollowedUserId === currentUserId) {
            return res.status(403).json({ message: "You cannot follow yourself" });
        }

        // Find the user being unfollowed and the current user
        const [unfollowedUser, currentUser] = await Promise.all([
            User.findById(unfollowedUserId),
            User.findById(currentUserId),
        ]);

        // check if the unfollowedUser and currentUser exist
        if(!unfollowedUser || !currentUser) {
            return res.status(404).json({ message: "User not found" })
        }

        // Check if the currentUser is following the user to unfollow
        if (!unfollowedUser.followers.includes(currentUserId)) {
            return res.status(403).json({ message: "You are not following this user"});
        }

        // Update the unfollowUser's followers and currentUser's following
        await User.updateOne(
            { _id: unfollowedUserId },
            { $pull: { followers: currentUserId } }
        ).exec();

        await User.updateOne(
            { _id: currentUserId },
            { $pull: { followings: unfollowedUserId } }
        ).exec();

        const [unfollowedUser1, currentUser1] = await Promise.all([
            User.findById(unfollowedUserId),
            User.findById(currentUserId),
        ]);

        console.log(unfollowedUser1);
        console.log(currentUser1);


        return res.status(200).json({ message: "User has been unfollowed" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router