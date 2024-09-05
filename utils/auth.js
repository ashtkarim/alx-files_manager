import { ObjectId } from 'mongodb';
import redisClient from './redis';
import dbClient from './db';

export const getUserByToken = async (req) => {
  const token = req.header('X-Token');
  if (!token) {
    return null;
  }
  const authKey = `auth_${token}`;
  const userId = await redisClient.get(authKey);
  if (userId) {
    const user = dbClient.usersCollection.findOne({ _id: new ObjectId(userId) });
    if (user) {
      return user;
    }
    return null;
  }
  return null;
};
