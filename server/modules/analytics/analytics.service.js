const User = require("../../models/User");
const ABCFile = require("../../models/ABCFile");
const Purchase = require("../../models/Purchase");

exports.getSystemStats = async () => {
  const totalUsers =
    await User.countDocuments({
      role: "customer",
    });

  const totalUploads =
    await ABCFile.countDocuments();

  const totalPurchases =
    await Purchase.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

  const purchaseCount =
    totalPurchases.length > 0
      ? totalPurchases[0].total
      : 0;

  // uploads grouped by year/month
  const uploadsByMonth =
    await ABCFile.aggregate([
      {
        $group: {
          _id: {
            year: {
              $year: "$dateUploaded",
            },
            month: {
              $month: "$dateUploaded",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

  // purchases grouped by year/month
  const purchasesByMonth =
    await Purchase.aggregate([
      {
        $group: {
          _id: {
            year: {
              $year: "$purchase_date",
            },
            month: {
              $month: "$purchase_date",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

  // process uploads
  const uploadsByYear = {};

  uploadsByMonth.forEach((upload) => {
    const year = upload._id.year;
    const month =
      upload._id.month - 1;

    if (!uploadsByYear[year]) {
      uploadsByYear[year] =
        Array(12).fill(0);
    }

    uploadsByYear[year][month] =
      upload.count;
  });

  // process purchases
  const purchasesByYear = {};

  purchasesByMonth.forEach((purchase) => {
    const year = purchase._id.year;
    const month =
      purchase._id.month - 1;

    if (!purchasesByYear[year]) {
      purchasesByYear[year] =
        Array(12).fill(0);
    }

    purchasesByYear[year][month] =
      purchase.count;
  });

  return {
    totalUsers,
    totalUploads,
    totalPurchases: purchaseCount,
    uploadsByYear,
    purchasesByYear,
  };
};