import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    // await dbClient.connect();
    const { email } = req.body;
    const { password } = req.body;
    //   console.log(email);
    //   console.log(password);
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    const users = dbClient.usersCollection;
    users.findOne({ email }, (err, user) => {
      if (user) {
        res.status(400).json({ error: 'Already exist' });
      } else {
        const hashedPassword = sha1(password);
        users.insertOne(
          {
            email,
            password: hashedPassword,
          },
        ).then((result) => {
          res.status(201).json({ id: result.insertedId, email });
        }).catch((error) => console.log(error));
      }
    });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      const authKey = `auth_${token}`;
      const userId = await redisClient.get(authKey);
      if (userId) {
        dbClient.usersCollection.findOne({ _id: new ObjectId(userId) }, (err, user) => {
          if (user) {
            res.status(200).json({ id: userId, email: user.email });
          } else {
            res.status(401).json({ error: 'Unauthorized' });
          }
        });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    }
  }
}

module.exports = UsersController;
