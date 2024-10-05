import { ObjectId } from 'mongodb'
import { connectToDatabase } from 'src/configs/dbConnect'
import { getToken } from 'next-auth/jwt'

export default async function handler(req, res) {
  const client = await connectToDatabase()

  const {
    query: { id },
    method
  } = req

  const token = await getToken({ req })
  const myUser = await client.db().collection('users').findOne({ email: token.email })
  if (!myUser || !myUser.permissions || !myUser.permissions.includes('ViewCompany')) {
    return res.status(401).json({ success: false, message: 'Not Auth' })
  }

  // try { 
  const company = await client
    .db()
    .collection('companies')
    .findOne({
        _id: ObjectId(myUser.company_id)
    })

  return res.status(200).json({ success: true, data: [company] })
}
