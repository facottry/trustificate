const { asyncHandler } = require('../../middlewares/error.middleware');
const { success } = require('../../utils/apiResponse');
const openaiService = require('../../services/openaiService');

const assist = asyncHandler(async (req, res) => {
  const { type, context } = req.body;

  let suggestions;

  switch (type) {
    case 'document-fill':
      suggestions = await openaiService.generateDocumentSuggestions(context);
      break;
    case 'template-assist':
      suggestions = await openaiService.generateTemplateSuggestions(context);
      break;
    default:
      throw new Error('Invalid AI assist type');
  }

  success(res, { suggestions });
});

module.exports = { assist };
