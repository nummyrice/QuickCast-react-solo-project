const express = require('express');
const asyncHandler = require('express-async-handler');
const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Company, Tag, ActingGig, User } = require('../../db/models');

const { check, matchedData } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

// setup for cloudinary image storage
const multer = require('multer');
const upload = multer();
const { uploadToCloudinary } = require('../../utils/cloudinary');

const router = express.Router();

// validateCompany must be used AFTER multer and requireAuth
const validateCompany = [
  check('userId')
    .exists()
    .withMessage('User ID required.')
    .bail()
    .custom(async value => {
      const userExists = await User.findByPk(value);
      if (!userExists) return Promise.reject('User does not exists.')
      return true;
    }),
  check('name')
    .exists({checkFalsey: true})
    .withMessage('Please provide a company name.'),
  check('phoneNumber')
    .isLength({ min: 10, max: 12})
    .withMessage('Phone number must be a valid length.')
    .exists({checkFalsey: true})
    .isMobilePhone("any")
    .withMessage('Please provide a valid phone number.')
    .custom(async value => {
      const numExists = await Company.findOne({where: {phoneNumber: value}})
      if (numExists) return Promise.reject('Phone numbers must be unique.');
      return true;
    }),
  check('details')
    .optional(),
  check('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL.'),
  handleValidationErrors,
];

const validateUpdate = [
  check('id')
    .exists()
    .withMessage('Company ID required.')
    .custom(async value => {
      const companyExists = await Company.findByPk(value)
      if (!companyExists) return Promise.reject('Company does not exist')
    }),
  check('name')
    .isLength({ min: 1, max: 30})
    .withMessage('Please provide a company name less than 30 characters.')
    .optional(),
  check('phoneNumber')
    .isLength({ min: 10, max: 12})
    .withMessage('Phone number must be a valid length.')
    .exists({checkFalsey: true})
    .isMobilePhone("any")
    .withMessage('Please provide a valid phone number.')
    .custom(async value => {
      const numExists = await Company.findOne({where: {phoneNumber: value}})
      if (numExists) return Promise.reject('Phone numbers must be unique.');
      return true;
    }).optional(),
    check('details')
    .optional(),
    check('website')
    .isURL()
    .withMessage('Please provide a valid URL.')
    .optional(),
    handleValidationErrors,
  ];

  //TODO check if this /all route needs to be before the other routes. Can we add regex to make it more specific
  // GET all companies
  router.get('/all', asyncHandler(async (req, res) => {
    // TODO should be ordered by the most when gigs under this company
    // were updated ASC
    const companies = await Company.findAll();
    return res.json(companies);
  }));

  // Create Company Portfolio
// TODO: add requireAuth to middleware
router.post('/', upload.single('companyImage'), validateCompany, asyncHandler(async (req, res) => {
  const requiredData = matchedData(req, { includeOptionals: false });
  const {userId, name, phoneNumber, details, website } = requiredData
  const isImage = req.file && req.file.buffer;
  let image;
  if (isImage) {
    image = await uploadToCloudinary(isImage)
    image = image.url;
  };

  const company = await Company.create({
    userId,
    name,
    phoneNumber,
    details,
    image,
    website,
  });
  return res.json(company);
}));

// Update Company Portfolio
// TODO: add requireAuth to middleware
router.put('/', upload.single('companyImage'), validateUpdate, asyncHandler(async (req, res) => {
  const requiredData = matchedData(req, { includeOptionals: false });
  const {id, name, phoneNumber, details, website} = requiredData
    const isImage = req.file && req.file.buffer;
    let image;
    if (isImage) image = await uploadToCloudinary(isImage);
    const companyToUpdate = await Company.findByPk(id);
    const updatedCompany = await companyToUpdate.updateDetails(name, phoneNumber, details, website, image)
    return res.json(updatedCompany);
}))

// Delete Company Portfolio
// TODO: add requireAuth to middleware
router.delete('/', asyncHandler(async (req, res, next) => {
  const companyId = req.body.id;
  const companyToDelete = await Company.findByPk(companyId);
  if (!companyToDelete) return next(new Error('Company does not exist'))
  await companyToDelete.destroy();
  return res.json({'message': "successfully deleted"})
}));

const getTagId = async (tag) => {
  const trimmedLowerCaseTag = tag.trim().toLowerCase();
  const tagExists = await Tag.findAll({where: {name: trimmedLowerCaseTag}});
  if (tagExists.length) {
    return tagExists[0].id;
  } else {
    const newTag = await Tag.create({name:trimmedLowerCaseTag});
    return newTag.id;
  }
};

// Create company production
// router.post('/gig/create', requireAuth, asyncHandler(async (req, res) => {
//   const gigData = req.body;


//   if (gigData.tags) {
//     const tagsArray = gigData.tags.split(',');
//     tagsArray.forEach((tag) => {
//       tag.trim();
//       tag.toLowerCase();
//     });
//     const results = await Promise.all(
//       tagsArray.map(tag => {
//         return getTagId(tag)
//       }));
//     delete gigData.tags;
//     gigData.tagIds = results;
//   }  else {
//     delete gigData.tags;
//     gigData.tagIds = [];
//   };
//   await ActingGig.create(gigData);
//   const allGigs = await ActingGig.findAll({where: {userId: gigData.userId}});

//   res.json(allGigs);
// }))



module.exports = router;
