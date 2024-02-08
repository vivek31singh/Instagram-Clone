var mongoose = require("mongoose");

mongoose.connect('mongodb://127.0.0.1:27017/Instagram', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


var userSchema = new mongoose.Schema({
    profileImage:String,
    mobile:String,
    email:String,
    fullname: String,
    username: String,
    HashPassword: String,
})

var commentsSchema = new mongoose.Schema({
    username: String,
    comment: String,
    profile_img: String,
    commentTime: String,
    commentLikes: String,
    commentReplies: String
})

var postSchema = new mongoose.Schema({
  profileImage:String,
    username: String,
    userId: String,
    caption: String,
    postFile: String,
    likeCount:Number,
})


module.exports= {user:  mongoose.model("users", userSchema), comments: mongoose.model("comments",commentsSchema ), post: mongoose.model("posts", postSchema)}