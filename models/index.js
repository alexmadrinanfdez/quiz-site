const path = require('path');
// Load ORM
const Sequelize = require('sequelize');

// To use SQLite data base:
const sequelize = new Sequelize("sqlite:quiz.sqlite");
// Import the definition of quiz from quiz.js
sequelize.import(path.join(__dirname, 'quiz'));
// Session
sequelize.import(path.join(__dirname, 'session'));

// Create tables
sequelize.sync()
.then(() => console.log("Data bases created successfully"))
.catch(error => {
    console.log("Error creating the data bases tables:", error);
    process.exit(1);
});

module.exports = sequelize;