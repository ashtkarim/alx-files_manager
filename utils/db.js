import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect().then(() => {
      this.db = this.client.db(this.database);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
    }).catch((err) => {
      console.error(err);
    });
  }

  // async connect() {
  //   if (!this.db) {
  //     await this.client.connect();
  //     this.db = this.client.db(this.database);
  //     this.usersCollection = this.db.collection('users');
  //     this.filesCollection = this.db.collection('files');
  //   }
  // }

  isAlive() {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  async nbUsers() {
    const users = this.db.collection('users');
    // await users.insertOne({ name: 'John Doe', email: 'john.doe@example.com' });
    const nbUsers = await users.countDocuments();
    return nbUsers;
  }

  async nbFiles() {
    const files = this.db.collection('files');
    // await files.insertOne({ name: 'John Doe', email: 'john.doe@example.com' });
    const nbFiles = await files.countDocuments();
    return nbFiles;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
