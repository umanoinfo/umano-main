import { ObjectId } from 'mongodb'
import { connectToDatabase } from 'src/configs/dbConnect'
import { getToken } from 'next-auth/jwt'

export default async function handler(req, res) {
  const {
    query: { id },
    method
  } = req


  const client = await connectToDatabase()

   // -------------------- Token --------------------------------------------------

   const token = await getToken({ req })
   const myUser = await client.db().collection('users').findOne({ email: token.email })
   if (!myUser || !myUser.permissions || !myUser.permissions.includes('ViewDepartment')) {
     return res.status(401).json({ success: false, message: 'Not Auth' })
   }
 
  const department = await client
    .db()
    .collection('departments')
    .aggregate([
      {
        $match: {
          _id: ObjectId(id),
          company_id: myUser.company_id.toString()
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { mng_id: { $toObjectId: '$user_id' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$mng_id'] } } }],
          as: 'user_info'
        }
      }
    ])
    .toArray()

  return res.status(200).json({ success: true, data: department })

}
