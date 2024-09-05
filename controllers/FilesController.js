import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { getUserByToken } from '../utils/auth';
import dbClient from '../utils/db';

const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) { 
    const user = await getUserByToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;
    const { type } = req.body;
    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    const { data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type ' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.filesCollection.findOne(
        { _id: new ObjectId(parentId), userId: user._id },
      );
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found ' });
      } if (parentFile.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not folder ' });
      }
    }

    if (type === 'folder') {
      dbClient.filesCollection.insertOne(
        {
          name,
          type,
          parentId,
          isPublic,
          userId: user._id,
        },
      ).then((folder) => res.status(201).json({
        id: folder.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
      })).catch((error) => {
        console.log(error);
      });
    } else {
      const filePath = `${folderPath}/${uuidv4()}`;
      try {
        await fs.mkdir(folderPath);
      } catch (error) {
        // console.log(error);
      }
      try {
        const buffData = Buffer.from(data, 'base64');
        await fs.writeFile(filePath, buffData, 'utf-8');
      } catch (error) {
        console.log(error);
      }
      dbClient.filesCollection.insertOne({
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
        localPath: filePath,
      }).then((file) => res.status(201).json({
        id: file.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
      })).catch((error) => {
        console.log(error);
      });
    }
    return null;
  }
  static async getShow (req, res) {
    const user = await getUserByToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = req.params.id;
    const file = await dbClient.filesCollection.findOne({ _id: new ObjectId(id), userId: user._id });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    } else {
      return res.status(200).json(file);
    }
  }

  static async getIndex(req, res) {
    const user = await getUserByToken(req);
    const page = parseInt(req.query.page) || 0;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const parentId = req.query.parentId || 0;

    

    const files = await dbClient.filesCollection.aggregate([
      { $match: parentId},
      { $skip: (page - 1) * 20},
      { $limit: 20},
    ]).toArray();

    return res.json(files);



    // db.files.aggregate([
    //   { $skip: skip },
    //   { $limit: pageSize }
    // ])
  }
}
module.exports = FilesController;
