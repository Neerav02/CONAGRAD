const mongoose = require('mongoose');
const Assignment = require('../Models/Assignment');
require('dotenv').config();

async function fixFileUrls() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const result = await Assignment.updateMany(
    { fileUrl: { $regex: '^/api/uploads/' } },
    [
      {
        $set: {
          fileUrl: {
            $replaceOne: { input: '$fileUrl', find: '/api/uploads/', replacement: '/uploads/' }
          }
        }
      }
    ]
  );

  // Also fix submission.fileUrl if present
  const assignments = await Assignment.find({ 'submission.fileUrl': { $regex: '^/api/uploads/' } });
  let updated = 0;
  for (const assignment of assignments) {
    assignment.submission.fileUrl = assignment.submission.fileUrl.replace('/api/uploads/', '/uploads/');
    await assignment.save();
    updated++;
  }

  console.log(`Updated fileUrl in ${result.modifiedCount} assignments.`);
  console.log(`Updated submission.fileUrl in ${updated} assignments.`);
  mongoose.disconnect();
}

fixFileUrls().catch(err => {
  console.error('Error fixing fileUrls:', err);
  process.exit(1);
}); 