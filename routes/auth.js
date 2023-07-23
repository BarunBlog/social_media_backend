const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt")

router.post("/register", async (req, res) => {

    try {
        // generate new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // create new user
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            desc: req.body.desc,
            city: req.body.city,
            from: req.body.from,
            relationship: req.body.relationship,
            isAdmin: false,
        });

        // save user and return response
        const user = await newUser.save();
        res.status(200).json(user);
    } catch (error) {
        console.log(error)
        res.status(400).json({message: "Registration failed"});
    }
})


router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email});
        if(!user)
            return res.status(404).json({message: "user not found"});

        const validPassword = await bcrypt.compare(req.body.password, user.password)
        if(!validPassword)
            return res.status(400).json({message: "wrong password"})

        res.status(200).json(user)
    } catch (err) {
        console.log(err);
        return res.status(500).json({message: "Login failed"});
    }
})


module.exports = router