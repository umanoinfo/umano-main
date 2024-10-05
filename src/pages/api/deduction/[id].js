import { ObjectId } from 'mongodb'
import { connectToDatabase } from 'src/configs/dbConnect'
import { getToken } from 'next-auth/jwt'

export default async function handler(req, res) {
  const {
    query: { id },
    method
  } = req

  // try {
  const client = await connectToDatabase()
  const token = await getToken({ req })
  const myUser = await client.db().collection('users').findOne({ email: token.email })
  if (!myUser || !myUser.permissions || !myUser.permissions.includes('ViewPayrollDeduction')) {
    return res.status(401).json({ success: false, message: 'Not Auth' })
  }
  

  const deduction = await client
    .db()
    .collection('deductions')
    .aggregate([
      {
        $match: {
          _id: ObjectId(id),
          company_id: myUser.company_id.toString()
        }
      }
    ])
    .toArray()

  return res.status(200).json({ success: true, data: deduction })
}
