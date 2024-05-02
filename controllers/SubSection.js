const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const upload = require("../utils/imageUploader");

//create Subsection

exports.createSubSection = async (req, res) => {
  try {
    //fetch data

    const { sectionId, title, description } = req.body;
    const video = req.files.video;
    console.log("sec id->", sectionId);
    console.log("title->", title);
    console.log("video->", description);
    console.log("video->", req.files);
    //validation
    if (!sectionId || !title || !description || !video) {
      return res.status(404).json({
        success: false,
        message: "please fill out all fields",
      });
    }

    //upload video to cloudinary
    const uploadDetails = await upload.uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    //create subsection
    const subSection = await SubSection.create({
      title: title,
      description: description,
      timeDuration: `${uploadDetails.duration}`,
      videoUrl: uploadDetails.secure_url,
    });

    //push subsec id to section
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: subSection._id,
        },
      },
      { new: true }
    ).populate("subSection");

    //return res
    return res.status(200).json({ success: true, data: updatedSection });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant create a subsection",
    });
  }
};

//update subsection
exports.updateSubSection = async (req, res) => {
  try {
    //fetch the id
    const { subSectionId, title, description, sectionId } = req.body;

    const video = req.files.videoFile;

    const subSection = await SubSection.findById(subSectionId);

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }
    //validate the data

    if (!subSectionId || !title || !description || !video) {
      return res.status(404).json({
        success: false,
        message: "please fill out all fields",
      });
    }

    //update the subSection
    if (title !== undefined) {
      subSection.title = title;
    }

    if (description !== undefined) {
      subSection.description = description;
    }
    if (req.files && req.files.video !== undefined) {
      const video = req.files.video;
      const uploadDetails = await upload.uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      );
      subSection.videoUrl = uploadDetails.secure_url;
      subSection.timeDuration = `${uploadDetails.duration}`;
    }

    await subSection.save();

    // find updated section and return it
    console.log(sectionId);
    const cleanedSectionId = sectionId.trim();
    const updatedSection = await Section.findById(cleanedSectionId).populate(
      "subSection"
    );

    //return res
    console.log("updated section", updatedSection);

    return res.json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "cant update the subsection",
    });
  }
};

//delete subsection

exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body;
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    );
    const subSection = await SubSection.findByIdAndDelete({
      _id: subSectionId,
    });

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" });
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    );

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    });
  }
};
