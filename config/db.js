const MongoClient = require('mongodb').MongoClient

// DB
const state = {
    db: null

}

module.exports.connect = function (done) {
    const url = process.env.MONGOURL;
    const dbname = 'staff_work';
  
    MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.log('Failed to connect to database');
        return done(err);
      }
      state.db = client.db(dbname);
      console.log('Connected to database');
      done();
    });
  };

module.exports.get = function () {
    return state.db
}

