import multer from "multer";
import * as fs from "fs";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uid = req.query.userId;
    let path = `./${uid}documents/`;

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    cb(null, path);
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
});

// const maxSize = 1024 * 1024 * 2;

export const upload = multer({
  storage,
  // limits: {fileSize: maxSize}
});
