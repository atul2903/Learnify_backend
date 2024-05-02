const Category = require("../models/Category");
const Tag = require("../models/Category");
const Course = require("../models/Course");

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

//create tag api

exports.createCategory = async (req, res) => {
  try {
    //data fetch from body

    const { name, description } = req.body;
    //validation

    if (!name || !description) {
      return res.success(400).json({
        success: false,
        message: "cant fetch all the data",
      });
    }

    //create tag and push to db

    const tagDetails = await Tag.create({
      name: name,
      description: description,
    });

    console.log(tagDetails);

    return res.status(201).json({
      success: true,
      message: "tag created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: true,
      message: "cant create a tag",
    });
  }
};

//get all tags

exports.showAllCategories = async (req, res) => {
  try {
    const allTags = await Tag.find({}, { name: true, description: true });
    console.log(allTags);
    res.status(201).json({
      success: true,
      message: "all tags are returned successfully",
      allTags,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: true,
      message: "cant get all tag",
    });
  }
};

//category page details

exports.categoryPageDetails = async (req, res) => {
  try {
    //get category id
    const { categoryId } = req.body;
    //fetch all courses
    const selectedCategory = await Category.findById(categoryId)
      .populate("courses")
      .exec();

    //validation
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "no course found for this category",
      });
    }
    //get courses for different category
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    });
    let differentCategories = await Category.findOne(
      categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
        ._id
    )
      .populate("courses")
      .exec();

    //get top selling courses
    const allCourses = await Course.find({});
    const topCourses = allCourses.sort(
      (a, b) => b.studentsEnrolled.length - a.studentsEnrolled.length
    );

    const top10 = topCourses.slice(1, 10);
    //return
    return res.status(200).json({
      success: true,
      data: { selectedCategory, differentCategories, top10 },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant get all categories",
    });
  }
};
