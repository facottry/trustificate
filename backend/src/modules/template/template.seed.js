const Template = require('./template.schema');
const defaultTemplates = require('./default-templates');

const seedSystemTemplates = async () => {
  try {
    const existing = await Template.find({ isSystem: true }).lean();
    const existingTitles = new Set(existing.map((t) => t.title));
    const toCreate = defaultTemplates.filter((t) => !existingTitles.has(t.title));

    if (toCreate.length > 0) {
      // Ensure createdBy and organizationId are empty for system templates.
      const templatesToInsert = toCreate.map((t) => ({ ...t, organizationId: null, createdBy: null }));
      await Template.insertMany(templatesToInsert);
      console.log(`  ✅  Seeded ${templatesToInsert.length} system templates`);
    }
  } catch (err) {
    console.error('  ❌  Error seeding system templates:', err.message);
  }
};

module.exports = { seedSystemTemplates };
