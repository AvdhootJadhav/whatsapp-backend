import express from 'express';
import mongoose, { mongo } from 'mongoose';
import Messages from './dbMessages.js'
import Pusher from 'pusher';
import cors from 'cors';

const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1498702",
    key: "e0bbae6bd53b5c5062c3",
    secret: "409e7c872a8a6d146ae6",
    cluster: "ap2",
    useTLS: true
});

app.use(express.json())
app.use(cors())

const connection_url = 'mongodb+srv://Avdhoot:test123@cluster0.wqy0i7n.mongodb.net/Whatsapp-clone?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.once('open',()=> {
    console.log('DB connected')

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()

    changeStream.on('change',(change)=>{
        console.log(change);

        if(change.operationType === 'insert'){
            const  messageDetails = change.fullDocument;

            pusher.trigger('messages','inserted',{
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        }
        else{
            console.log("Error logging");
        }
    })
})


app.get('/',(req,res)=>{
    res.status(200).send('Hello world')
})

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body

    Messages.create(dbMessage, (err,data)=>{
        if(err){
            return res.status(500).send(err)
        }
        return res.status(201).send(`${data}`)
    })
})

app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            return res.status(500).send(err)
        }
        return res.status(200).send(data)
    })
})

app.listen(port,()=> console.log(`Server running on port ${port}`))