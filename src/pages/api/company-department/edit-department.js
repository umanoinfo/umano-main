import { ObjectId } from 'mongodb'
import { getToken } from 'next-auth/jwt'
import { connectToDatabase } from 'src/configs/dbConnect'

export default async function handler(req, res) {
  if(req.method != 'POST'){
    return res.status(405).json({success: false , message: 'Method is not allowed'});
  }
  const client = await connectToDatabase()
  
  const departmen = req.body.data
  const id = departmen._id

  // ---------------- Token ----------------

  const token = await getToken({ req })

  const myUser = await client.db().collection('users').findOne({ email: token.email })

  if (!myUser || !myUser.permissions || !myUser.permissions.includes('EditDepartment')) {
    return res.status(401).json({ success: false, message: 'Not Auth' })
  }

  // --------------------------------------------------------------
  const dep = await client.db().collection('departments').findOne({_id: ObjectId(id) , company_id: myUser.company_id.toString()});
  if(!dep){
    return res.status(404).json({success: false, message: 'Department not found'});
  }



  if(departmen.parent == ""){
    departmen.parent =null
  }

  delete departmen._id

  if (!departmen.name) {
    return res.status(422).json({
      message: 'Invalid input'
    })
  }

  const newDepartmen = await client
    .db()
    .collection('departments')
    .updateOne({ _id: ObjectId(id) , company_id: myUser.company_id.toString() }, { $set: departmen }, { upsert: false })

  // ---------------- logBook ----------------

  let log = {
    user_id: myUser._id,
    company_id: myUser.company_id,
    Module: 'Department',
    Action: 'ُEdit',
    Description: 'Edit department (' + departmen.name + ')',
    created_at: new Date()
  }
  const newlogBook = await client.db().collection('logBook').insertOne(log)

  return res.status(201).json({ success: true, data: departmen })
}
