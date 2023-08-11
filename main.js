
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const connectdb = require('./config/connection');
const dotenv= require('dotenv').config();
const bcrypt=require('bcrypt');




connectdb();


const app=express();
app.use(bodyParser.json());


const userSchema = new mongoose.Schema({
  username: String,
  preferredDomain: String,
  subdomain:String,
  password:String,
  premium: Boolean,
  routes: [String]
});


const Userss  = mongoose.model('UserOnsite', userSchema);

app.post('/new_user', async (req, res) => {
  const { username, password, preferredDomain } = req.body;
  const existingUser = await Userss.findOne({username});
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedpassword = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hashedpassword);

  
  
  const subdomain = `${preferredDomain.replace('.com', '.xyz.com')}`;

  const newUser = new Userss({
    username,
  
    preferredDomain,
    
    subdomain,
    password:hashedpassword,
    routes: []
  });

  await newUser.save();

  res.status(201).json({ subdomain });
});

app.post('/new_route', async (req, res) => {
  const { username,password, routeName } = req.body;
  const user = await Userss.findOne({ username });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Authentication failed' });
    
  }
    

  
  //const user = await Userss.findOne({ username, password });
  


  
  const subdomain = `${user.preferredDomain.replace('.com', '.xyz.com')}`;
  const fullRoute = `${subdomain}${routeName}`;
  user.routes.push(fullRoute);
  await user.save();
  res.status(200).json({ message: 'Route added successfully' });

  
});

app.get('/view_route', async (req, res) => {
  const { username,password } = req.body;

  const user = await Userss.findOne({ username });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Authentication failed' });
    
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const routes = user.routes;

  res.status(200).json({ routes });
});

app.put('/premium', async (req, res) => {
  const { username,password } = req.body;

  const user = await Userss.findOne({ username});
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Authentication failed' });
    
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.subdomain = user.subdomain.replace('.xyz', '');
  user.premium = true;

  for (let i = 0; i < user.routes.length; i++) {
    user.routes[i] = user.routes[i].replace('.xyz', '');
  }

  await user.save();

  res.status(200).json({ message: 'Premium upgrade successful' });
});



app.get('/view_users', async (req, res) => {
  try {
    const usersWithRoutes = await Userss.find({}, 'username routes');

    const formattedUsers = usersWithRoutes.map(user => ({
      username: user.username,
      routes: user.routes
    }));

    res.status(200).json({ users: formattedUsers });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching users' });
  }
});




const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
