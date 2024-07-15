const createApiFeatures = (query, queryObj) => {
  let internalQuery = query;
  const internalQueryObj = queryObj;
  // console.log({ queryObj });
  const search = () => {
    let keyword;
    if (internalQueryObj.keyword) {
      const regex = new RegExp(internalQueryObj.keyword, 'i');
      keyword = { $and: [{ $or: [{ 'name': regex }, { 'email': regex }, { 'phoneNumber': regex }, { 'message': regex }] }] };
    } else {
      keyword = {};
    }

    internalQuery = internalQuery.find({ ...keyword });
    return apiFeatures;
  };

  const filter = () => {
    const queryCopy = { ...internalQueryObj };

    // Removing some fields for category
    const removeFields = ['keyword', 'page', 'limit'];

    removeFields.forEach((key) => delete queryCopy[key]);

    // Filter For Price and Rating
    let queryObjCopy = JSON.stringify(queryCopy);
    queryObjCopy = queryObjCopy.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);
    internalQuery = internalQuery.find(JSON.parse(queryObjCopy));
    return apiFeatures;
  };

  const pagination = (resultPerPage) => {
    const currentPage = Number(internalQueryObj.page) || 1;
    const skip = resultPerPage * (currentPage - 1);

    internalQuery = internalQuery.limit(resultPerPage).skip(skip);

    return apiFeatures;
  };

  const apiFeatures = {
    search,
    filter,
    pagination,
    get query() {
      return internalQuery;
    },
  };

  return apiFeatures;
};

export default createApiFeatures;


