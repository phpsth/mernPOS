const getCourseName = (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Full stack developer",
            timeStamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "get course name error",
            error: error.message
        });
    }
};

const postCourse = (req, res) => {
    try {
        const {name} = req.body;

        if(!name){
            res.status(500).json({
                message: "error, there is no course name"
            });
        };

        res.status(201).json({
            success: true,
            name: name,
            message: `${name} course created successfully`
        });
    } catch (error) {
        res.status(500).json({message: "error course post"});
    }
};

module.exports = {
    getCourseName,
    postCourse
}