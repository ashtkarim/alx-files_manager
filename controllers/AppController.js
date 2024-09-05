import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    const numUsers = await dbClient.nbUsers();
    const numFiles = await dbClient.nbFiles();
    res.json({ users: numUsers, files: numFiles }).status(200);
  }
}
module.exports = AppController;
