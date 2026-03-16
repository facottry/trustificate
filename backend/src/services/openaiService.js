const OpenAI = require('openai');

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

class OpenAIService {
  async generateDocumentSuggestions(context) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Generate suggestions for filling out a certificate document based on the following context:
Template Title: ${context.templateTitle}
Template Prefix: ${context.templatePrefix}
Recipient Name: ${context.recipientName || 'Not provided'}
Course Name: ${context.courseName || 'Not provided'}
Company Name: ${context.companyName || 'Not provided'}
Available Placeholders: ${context.placeholders?.join(', ') || 'None'}

Please provide suggestions for:
- recipientName: A suitable name for the recipient
- courseName: A relevant course or achievement name
- companyName: An appropriate company or organization name

Respond with a JSON object containing these fields.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      // Parse the JSON response
      const suggestions = JSON.parse(content);
      return suggestions;
    } catch (error) {
      console.error('OpenAI document suggestions error:', error);
      throw new Error('Failed to generate document suggestions');
    }
  }

  async generateTemplateSuggestions(context) {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Generate suggestions for creating a certificate template based on the following context:
Title: ${context.title || 'Not provided'}
Subtitle: ${context.subtitle || 'Not provided'}
Body Text: ${context.bodyText || 'Not provided'}
Layout: ${context.layout || 'Not provided'}
Number Prefix: ${context.numberPrefix || 'Not provided'}

Please provide suggestions for:
- title: A compelling title for the certificate
- subtitle: A suitable subtitle
- bodyText: Descriptive text for the certificate body

Respond with a JSON object containing these fields.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      // Parse the JSON response
      const suggestions = JSON.parse(content);
      return suggestions;
    } catch (error) {
      console.error('OpenAI template suggestions error:', error);
      throw new Error('Failed to generate template suggestions');
    }
  }
}

module.exports = new OpenAIService();