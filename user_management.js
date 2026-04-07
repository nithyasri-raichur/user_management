import {createServer} from 'http';
const PORT = process.env.PORT || 8000;
import fs from 'fs/promises';

const getUsers = async() => {
    const file = await fs.readFile('./users.json', 'utf8');
    return JSON.parse(file);
}

//middleware
const logger = (req,res,next) =>{
    console.log(`${req.method} ${req.url}`);
    next();
}

//json middleware
const jsonMiddleware = (req,res,next) =>{
    res.setHeader('Content-type','application/json');
    next();
}

//handler for GET/api/users
const getUsersHandler = async (req,res) =>{
    try{
        const users = await getUsers();
        res.end(JSON.stringify(users));

    }
    catch(err){
        res.statusCode = 500;
        res.end(JSON.stringify({message: 'Error reading users'}));
    }
}

// handler for GET/api/users/id
const getUsersById = async(req,res) =>{
    try{
        const userById = await getUsers();
        const id = req.url.split('/')[3];
        const user = userById.find((u) => u.id === parseInt(id));

        if(user){
            return res.end(JSON.stringify(user));
        }
        else{
            res.statusCode = 404;
            return res.end(JSON.stringify({message:'User not found'}));
        }

    }
    catch (err){
        res.statusCode= 500;
        return res.end(JSON.stringify({message: 'Server Error'}));
    }
}


//POST api/users
const createUser = (req,res) =>{
    let body = '';
    req.on('data',(chunk)=>{
    body+=chunk.toString(); //data comes in pieces 
});
    req.on('end',async()=>{

        try{
            //convert string->object
            const newUser = JSON.parse(body);
            //reading new user
            const users = await getUsers();
            //adding new user
            users.push(newUser);
            //writing back the new user to file
            await fs.writeFile('./users.json',JSON.stringify(users));
            //send response 
            res.statusCode=201;
            res.end(JSON.stringify(newUser));
        }
        catch(err){
            res.statusCode = 400;
            res.end(JSON.stringify({message: 'Invalid Json'}));
        }
    
});

    };

//PUT api/users/id
const userUpdate = async(req,res)=>{
    let body = '';

    //collect data
    req.on('data',(chunk)=>{
        body += chunk.toString();
    });

    //when data recieved
    req.on('end', async()=>{
        console.log("Final Body",body);
        try{
            const updatedData = JSON.parse(body); //string->object 

            const users = await getUsers(); //reading the users
            const id = parseInt(req.url.split('/')[3]);

            const index = users.findIndex(u=> u.id===id); //find the position of the id in array

        if(index === -1){
            res.statusCode = 404;
            res.end(JSON.stringify({message: 'User not found'}));
        }
        else{
            users[index] = {...users[index],...updatedData}; //spread method to merge the old+new data 
            await fs.writeFile('./users.json',JSON.stringify(users)); //overwriting to the file 
            //send response 
            res.end(JSON.stringify(users[index])); //object->string

        }
        
        }
        catch(err){
            res.statusCode = 400;
            res.end(JSON.stringify({message: 'Invalid Json'}));
        }

        });
};

//delete api/users/id

const deleteUser= async(req,res)=>{
    try{
        const userById = await getUsers(); //read all users from file
        const id = req.url.split('/')[3];//extract id from url 
        const updatesuser = userById.filter((u) => u.id !== parseInt(id));//filter the one u want to delete 

        if(updatesuser.length===userById.length){ //if the length is equal , nothing is removed (user not found)
            res.statusCode = 404;
            return res.end(JSON.stringify({message:'User not found'}));
            
        }
        else{ //if the length is not equal , remove user
            await fs.writeFile('./users.json',JSON.stringify(updatesuser)); //overwrite the file

            res.statusCode = 200;
            res.end(JSON.stringify({message: 'user deleted successfully'})); 
        }

    }
    catch (err){
        res.statusCode= 500;
        return res.end(JSON.stringify({message: 'Server Error'}));
    }
}



const server = createServer((req,res)=>{
    logger(req,res, () => {
        jsonMiddleware (req,res,()=>{
            if(req.url === '/api/users' && req.method === 'GET'){
                getUsersHandler(req,res);
            }
            else if (req.url.match(/\/api\/users\/([0-9]+)/) && req.method === 'GET'){
                getUsersById(req,res);
            }
            else if(req.url === '/api/users' && req.method === 'POST'){
                createUser(req,res);

            }
            else if (req.url.match(/\/api\/users\/([0-9]+)/) && req.method === 'PUT'){
                userUpdate(req,res);

            }
            else if (req.url.match(/\/api\/users\/([0-9]+)/) && req.method === 'DELETE'){
                deleteUser(req,res);
            }

            else{
                notFoundHandler(req,res);
            }
        });

        });


});

server.listen(PORT,() =>{
    console.log(`Server running on port ${PORT}`);
});





   



    



