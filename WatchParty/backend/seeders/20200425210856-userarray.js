const bcrypt = require('bcrypt')
const env = process.env.NODE_ENV || 'development'
const config = require('../config/config.js')[env]

module.exports = {
  up: async(queryInterface, Sequelize) => { // eslint-disable-line no-unused-vars
    const demoUserPassword = await bcrypt.hash(config.demo_user_password, config.salt_rounds)
	let usersArray = [];
	for(let i = 0; i < 100;i++){
		usersArray.push({
			email:'testemail'+i+'@gmail.com',
			firstname:'firstname'+i,
			lastname:'lastname'+i,
			password: demoUserPassword,
			createdAt:new Date(),
			updatedAt:new Date()
		})
	}
    return queryInterface.bulkInsert("User", usersArray);
  },

  down: (queryInterface, Sequelize) => { // eslint-disable-line no-unused-vars
    return queryInterface.bulkDelete("User", null);
  }
};
