const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
require('dotenv').config();
const SneaksAPI = require('sneaks-api');
const sneaks = new SneaksAPI();

//Create mongoclient
const client = new MongoClient(process.env.FINAL_URL);

const app = express();
const port = process.env.port || 1337;

app.use(
    express.urlencoded({
        extended: false,
    })
);
app.use(cors());
app.use(express.json());

app.get('/testMongo', async (req, res) => {
    try {
        //connect to the db
        await client.connect();

        //retrieve the users collection data
        const colli = client.db('logintutorial').collection('users');
        const users = await colli.find({}).toArray();

        //send back to the data with the response
        res.status(200).send(users);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error,
        });
    } finally {
        await client.close();
    }
});

app.post('/register', async (req, res) => {
    //Check for empty fields
    if (!req.body.username || !req.body.email || !req.body.password) {
        res.status(401).send({
            status: 'Bad request',
            message: 'Some fields are missing: username, email, password',
        });
        return;
    }

    try {
        //connect to the db
        await client.connect();

        const user = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            uuid: uuidv4(),
        };
        //retrieve the users collection data
        const colli = client.db('logintutorial').collection('users');
        const insertedUser = await colli.insertOne(user);

        //Send back response when user is saved
        res.status(201).send({
            status: 'Saved',
            message: 'User has been saved!',
            data: insertedUser,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error,
        });
    } finally {
        await client.close();
    }
});

app.post('/login', async (req, res) => {
    //Check for empty fields
    if (!req.body.email || !req.body.password) {
        res.status(401).send({
            status: 'Bad request',
            message: 'Some fields are missing: email, password',
        });
        return;
    }

    try {
        //connect to the db
        await client.connect();

        const loginuser = {
            email: req.body.email,
            password: req.body.password,
        };

        //retrieve the users collection data
        const colli = client.db('logintutorial').collection('users');

        const query = {
            email: loginuser.email,
        };
        const user = await colli.findOne(query);

        if (user) {
            //Compare passwords
            if (user.password == loginuser.password) {
                //Password is correct
                res.status(200).send({
                    status: 'Authentication successfull!',
                    message: 'You are logged in!',
                    data: {
                        username: user.username,
                        email: user.email,
                        uuid: user.uuid,
                    },
                });
            } else {
                //Password is incorrect
                res.status(401).send({
                    status: 'Authentication error',
                    message: 'Password is incorrect!',
                });
            }
        } else {
            //No user found: send back error
            res.status(401).send({
                status: 'Authentication error',
                message: 'No user with this email has been found! Make sure you register first.',
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error,
        });
    } finally {
        await client.close();
    }
});

app.post('/verifyID', async (req, res) => {
    //Check for empty and faulty ID fields
    if (!req.body.uuid) {
        res.status(401).send({
            status: 'Bad request',
            message: 'ID is missing',
        });
        return;
    } else {
        if (!uuidValidate(req.body.uuid)) {
            res.status(401).send({
                status: 'Bad request',
                message: 'ID is not a valid UUID',
            });
            return;
        }
    }

    try {
        //connect to the db
        await client.connect();

        //retrieve the users collection data
        const colli = client.db('logintutorial').collection('users');

        const query = {
            uuid: req.body.uuid,
        };
        const user = await colli.findOne(query);

        if (user) {
            res.status(200).send({
                status: 'Verified!',
                message: 'Your UUID is valid.',
                data: {
                    username: user.username,
                    email: user.email,
                    uuid: user.uuid,
                },
            });
        } else {
            //Password is incorrect
            res.status(401).send({
                status: 'Verify error',
                message: `No user exist with uuid ${req.body.uuid}`,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error,
        });
    } finally {
        await client.close();
    }
});

// sneaks api
app.get('/popular-sneakers', async (req, res) => {
    try {
        const shoeLimit = 18; // Limit of shoes to return
        sneaks.getMostPopular(shoeLimit, function (err, products) {
            res.status(200).send(products);
        });
    } catch (error) {
        console.log('Error: ' + error);
    } finally {
    }
});

app.get('/sneakers', async (req, res) => {
    try {
        const shoeLimit = 18; // Limit of shoes to return
        sneaks.getProducts(shoeLimit, function (err, products) {
            res.status(200).send(products);
        });
    } catch (error) {
        console.log('Error: ' + error);
    } finally {
    }
});

app.get('/sneaker/id', async (req,res) =>{
        try {
            const sneakerId = req.query.id;
            console.log(sneakerId);
  
    // Function from sneaker API to get all sneakers
    const shoeLimit = 18; // Limit of shoes to return
        sneaks.getMostPopular(shoeLimit, function (err, products) {
             // Run through sneakers and filter by ID
        const result = products.filter((product) => product.id = sneakerId);
            res.status(200).send(result);
        });

        } catch (error) {
            console.log('Error: ' + error)
        }
  });

  //Api doesn't seem to work properly. Might be on me but I can't figure it out.

app.listen(3000);
console.log('app running at http://localhost:3000');
