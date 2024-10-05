import { ObjectId } from 'mongodb'
import { getToken } from 'next-auth/jwt'
import { connectToDatabase } from 'src/configs/dbConnect'

export default async function handler(req, res) {

  const client = await connectToDatabase()

  // ---------------------------- Token -------------------------------------

  const token = await getToken({ req })
  const myUser = await client.db().collection('users').findOne({ email: token.email })
  if (!myUser || !myUser.permissions || !myUser.permissions.includes('ViewUser')) {
    return res.status(401).json({ success: false, message: 'Not Auth' })
  }

  try {
    if (!req.query.userStatus) {
      req.query.userStatus = ''
    }
    if (!req.query.type) {
      req.query.type = ''
    }
    if (!req.query.q) {
      req.query.q = ''
    }
    
    const users = await client
      .db()
      .collection('users')
      .aggregate([
        {
          $match: {
            $and: [
              { $or: [{ type: 'employee' }, { type: 'manager' }] },
              { status: { $regex: req.query.userStatus } },
              { company_id : { $regex: myUser.company_id }},
              { type: { $regex: req.query.type } },
              { name: { $regex: req.query.q , '$options' : 'i' } },
              { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] }
            ]
          }
        },
        {
          $lookup: {
            from: 'companies',
            let: { company_id: { $toObjectId: '$company_id' } },
            pipeline: [
              { $addFields: { company_id: '$_id' } },
              { $match: { $expr: { $eq: ['$company_id', '$$company_id'] } } }
            ],
            as: 'company_info'
          }
        },
        {
          $sort: {
            created_at: -1
          }
        }
      ])
      .toArray()
      
    return res.status(200).json({ success: true, data: users })
  } catch (error) {
    return res.status(400).json({ success: false })
  }
}
