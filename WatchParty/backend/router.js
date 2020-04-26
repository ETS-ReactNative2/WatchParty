const express = require('express');
const router = express.Router();
const { UniqueConstraintError, ValidationError } = require('sequelize')
const bcrypt = require('bcrypt')

const env = process.env.NODE_ENV || 'development';
const config = require('./config/config.js')[env];
const models = require('./models')

// GET /api/userDetails
router.get('/userDetails/:userID', function(req, res) {
  models['User']
    .findOne({
      attributes: ['firstname', 'lastname'],
      where: { id: req.params.userID }
    })
    .then(user => {
      if (!user) throw Error()
      return res.status(200).json({ message: 'Success', user })
    })
    .catch(err => {
      console.log(err)
      return res.status(404).send({ message: `Unable to get user ${req.params.userID}` })
    })
});

// POST /api/createUser
router.post('/createUser', function(req, res) {
  // Collect parameters
  const params = {
    email: req.body.email,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname
  }

  // Create record
  models['User']
    .create(params)
    .then(async user => {
      // Update password with hash
      user.password = await bcrypt.hash(user.password, config.salt_rounds)
      user.save()
      res.status(200).json({ message: 'Success', details: `Created user with email: ${user.email}` })
    }).catch(err => {
      if (err instanceof UniqueConstraintError) {
        console.log(err)
        return res.status(412).send({ message: 'An account already exists with that email' })
      }
      else if (err instanceof ValidationError) {
        console.log(err)
        return res.status(412).send({ message: err.message })
      }
      else {
        console.log(err)
        return res.status(500).send({ message: 'Unable to create user' })
      }
    })
});

// POST /api/login
router.post('/login', (req, res) => {
  // Check if already logged in
  if (req.session.user !== undefined) {
    return res.status(200).json({ message: `Already logged in as ${req.session.user.email}` })
  }

  // Collect parameters
  const params = {
    email: req.body.email,
    password: req.body.password
  }

  // Validate parameters
  const validationCheck = Object.values(params).every(val => val !== undefined)
  if (!validationCheck) {
    return res.status(412).send({ message: 'Missing parameters' })
  }

  models['User']
    .findOne({
      attributes: ['email', 'password'],
      where: { email: params.email }
    })
    .then(async user => {
      const match = await bcrypt.compare(params.password, user.password)
      if (match) {
        req.session.user = user
        return res.status(200).json({ message: 'Success', details: `Logged in as ${user.email}` })
      }
      else {
        throw new Error('Incorrect login credentials')
      }
    }).catch(err => {
      if (err.message === 'Incorrect login credentials') {
        console.log(err)
        return res.status(403).send({ message: err.message })
      }
      else {
        console.log(err)
        return res.status(500).send({ message: 'Incorrect login credentials' })
      }
    })
})

// POST /api/logout
router.post('/logout', (req, res) => {
  // Check if already logged in
  if (req.session.user !== undefined) {
    req.session.destroy(err => {
      if (err) {
        console.log(err)
        return res.status(500).send({ message: 'Unable to logout' })
      }
      return res.status(200).json({ message: 'Sucess', details: 'You are now logged out' })
    })
  }
  else {
    return res.status(401).send({ message: 'Already logged out'})
  }
})

module.exports = router;
