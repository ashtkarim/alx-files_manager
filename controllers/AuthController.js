import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    // console.log(authHeader);

    // if (!authHeader || !authHeader.startsWith('Basic ')) {
    //   res.status(401).json({ error: 'Unauthorized' });
    //   return;
    // }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    const hashedPassword = sha1(password);
    const users = dbClient.usersCollection;

    users.findOne({ email, password: hashedPassword }, async (err, user) => {
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uuidv4();
      const authKey = `auth_${token}`;
      await redisClient.set(authKey, user._id.toString(), 24 * 60 * 60);
      return res.status(200).json({ token });
    });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const authKey = `auth_${token}`;
    const id = await redisClient.get(authKey);
    // console.log(token);
    if (id) {
      await redisClient.del(authKey);
      res.status(204).json({});
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = AuthController;
