const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Assignment } = require('../Models/Assignment');
require('dotenv').config();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function fixSubmissions() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const assignments = await Assignment.find({
    'submission.fileUrl': { $exists: true, $ne: null },
  });

  let updatedCount = 0;

  for (const assignment of assignments) {
    const sub = assignment.submission;
    let needsUpdate = false;

    // If fileName or fileSize or fileType is missing, try to fix
    if (!sub.fileName || !sub.fileSize || !sub.fileType) {
      const filePath = sub.fileUrl.startsWith('/uploads/')
        ? path.join(UPLOADS_DIR, sub.fileUrl.replace('/uploads/', ''))
        : path.join(UPLOADS_DIR, sub.fileUrl);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (!sub.fileName) {
          sub.fileName = path.basename(filePath);
          needsUpdate = true;
        }
        if (!sub.fileSize) {
          sub.fileSize = stats.size;
          needsUpdate = true;
        }
        if (!sub.fileType) {
          // Guess mimetype from extension
          if (sub.fileName.endsWith('.pdf')) {
            sub.fileType = 'application/pdf';
            needsUpdate = true;
          } else if (sub.fileName.endsWith('.docx')) {
            sub.fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            needsUpdate = true;
          } else if (sub.fileName.endsWith('.doc')) {
            sub.fileType = 'application/msword';
            needsUpdate = true;
          } else if (sub.fileName.endsWith('.pptx')) {
            sub.fileType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            needsUpdate = true;
          } else if (sub.fileName.endsWith('.ppt')) {
            sub.fileType = 'application/vnd.ms-powerpoint';
            needsUpdate = true;
          }
        }
      }
    }

    if (needsUpdate) {
      await assignment.save();
      updatedCount++;
      console.log(`Updated assignment ${assignment._id}`);
    }
  }

  console.log(`Done. Updated ${updatedCount} assignments.`);
  mongoose.disconnect();
}

fixSubmissions().catch(err => {
  console.error('Error fixing submissions:', err);
  mongoose.disconnect();
}); 