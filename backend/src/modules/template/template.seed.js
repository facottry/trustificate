const Template = require('./template.schema');
const defaultTemplates = require('./default-templates');

const seedSystemTemplates = async () => {
  try {
    const existing = await Template.find({ isSystem: true }).lean();
    const existingByTitle = new Map(existing.map((t) => [t.title, t]));

    let created = 0;
    let updated = 0;

    for (const tpl of defaultTemplates) {
      const found = existingByTitle.get(tpl.title);
      if (!found) {
        await Template.create({ ...tpl, organizationId: null, createdBy: null });
        created++;
      } else {
        // Update existing system templates with new fields if missing
        const updates = {};
        if (!found.categories?.length && tpl.categories?.length) updates.categories = tpl.categories;
        if (!found.description && tpl.description) updates.description = tpl.description;
        if (!found.colorTheme && tpl.colorTheme) updates.colorTheme = tpl.colorTheme;
        if (Object.keys(updates).length > 0) {
          await Template.updateOne({ _id: found._id }, { $set: updates });
          updated++;
        }
      }
    }

    if (created > 0) console.log(`  ✅  Seeded ${created} new system templates`);
    if (updated > 0) console.log(`  ✅  Updated ${updated} system templates with categories/descriptions`);
  } catch (err) {
    console.error('  ❌  Error seeding system templates:', err.message);
  }
};

module.exports = { seedSystemTemplates };
