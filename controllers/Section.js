const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
  try {
    //fetch data from body

    const { sectionName, courseId } = req.body;

    //data validation
    if (!sectionName || !courseId) {
      return res.status(404).json({
        success: false,
        message: "all fields are required",
      });
    }
    //section creation

    const newSection = await Section.create({
      sectionName: sectionName,
    });
    //update the course model

    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    console.log(updatedCourseDetails);

    //return res

    return res.status(200).json({
      success: true,
      message: "section created successfully",
      updatedCourseDetails,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant create a section",
    });
  }
};

//update a section

exports.updateSection = async (req, res) => {
  try {
    //fetch details from body
    const { sectionName, sectionId } = req.body;

    //data validation
    if (!sectionName || !sectionId) {
      return res.status(404).json({
        success: false,
        message: "all fields are required",
      });
    }
    //update the data

    const section = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        sectionName: sectionName,
      },
      { new: true }
    );

    //return res
    res.status(201).json({
      success: true,
      message: "section is updated successfully",
      section,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant update a section",
    });
  }
};

//delete section

exports.deleteSection = async (req, res) => {
  try {
    //fetch section id
    const { sectionId, courseId } = req.body;

    if (!sectionId || !courseId) {
      return res.status(404).json({
        success: false,
        message: "all fields are required",
      });
    }
    //delete section
    const deletedSection = await Section.findByIdAndDelete(sectionId);
    //send res

    res.status(200).json({
      success: true,
      message: "deleted a section",
      deletedSection,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant delete a section",
    });
  }
};
