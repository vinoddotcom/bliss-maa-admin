import {mongooseConnect} from "@/lib/mongoose";
import ApiFeatures from "@/lib/apiFeature"
import Enquiry from "@/models/Enquiry";

export const enquiryList = async (query) => {
  try {
    const resultPerPage = 1000;
    await mongooseConnect();
    Category.countDocuments();
    const enquiryCount = await enquiry.countDocuments(); // Assuming you have a enquiry model
    const enquiryQuery = enquiry.find();
    const apiFeature = ApiFeatures(enquiryQuery, query).search().filter();

    let enquiry = await apiFeature.query.select({ title: 1, images: { $slice: 1 }, category: 1 }).populate([{ path: "category", model: "Category", select: "name", strictPopulate: false }]);
    const filteredEnquiryCount = enquiry.length;
    apiFeature.pagination(resultPerPage);
    enquiry = await apiFeature.query.clone();
    return {
      success: true,
      enquiry,
      enquiryCount,
      resultPerPage,
      filteredEnquiryCount,
    }
  } catch (error) {
    // console.log("hello world",)
    console.log(error);
    // return {} as GetEnquiry
  }
};