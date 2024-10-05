import { ObjectId } from 'mongodb'
import { getToken } from 'next-auth/jwt'
import { connectToDatabase } from 'src/configs/dbConnect'

// ** Axios Imports
import axios from 'axios'

export default async function handler(req, res) {
  if(req.method != 'POST'){
    return res.status(405).json({success: false , message: 'Method is not allowed'});
  }
  const client = await connectToDatabase()

  // -------------------- Token --------------------------------------------------

  const token = await getToken({ req })
  const myUser = await client.db().collection('users').findOne({ email: token.email })
  if (!myUser || !myUser.permissions || !myUser.permissions.includes('AddFormRequest')) {
    return res.status(401).json({ success: false, message: 'Not Auth' })
  }

  // -------------------- Insert ---------------------------------------------

  const request = req.body.data

  if (!request.form_id || !request.content || !request.applicant_id) {
    res.status(422).json({
      message: 'Invalid input'
    })
    
    return
  }

  const max_no = await client.db().collection('forms').find().sort({ no: -1 }).limit(1).toArray()

  request.company_id = myUser.company_id
  request.user_id = myUser._id
  request.no = max_no[0].no + 1
  request.created_at = new Date()
  request.status = 'active'

  const newRequest = await client.db().collection('requests').insertOne(request)
  const insertedRequest = await client.db().collection('requests').findOne({ _id: newRequest.insertedId })

  // -------------------- logBook ------------------------------------------

  let log = {
    user_id: myUser._id,
    company_id: myUser.company_id,
    Module: 'Request',
    Action: 'Add',
    Description: 'Add Request (' + insertedRequest.no + ')',
    created_at: new Date()
  }
  const newlogBook = await client.db().collection('logBook').insertOne(log)

  return res.status(201).json({ success: true, data: insertedRequest })
}
