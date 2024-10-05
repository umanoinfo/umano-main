import { connectToDatabase } from 'src/configs/dbConnect'
import { getToken } from 'next-auth/jwt'

export default async function handler(req, res) {
  if (!req.query.q) {
    req.query.q = ''
  }
  if (!req.query.no) {
    req.query.no = ''
  }
  if (!req.query.month) {
    req.query.month = ''
  }
  if (!req.query.year) {
    req.query.year = ''
  }

  const client = await connectToDatabase()

  // -------------------- Token --------------------------------------------------

  const token = await getToken({ req })
  const myUser = await client.db().collection('users').findOne({ email: token.email })
  if (!myUser || !myUser.permissions || !myUser.permissions.includes('ViewPayroll')) {
    return res.status(401).json({ success: false, message: 'Not Auth' })
  }

  // --------------------- Get ------------------------------------------

  const payrolls = await client
    .db()
    .collection('payrolls')
    .aggregate([
      {
        $match: {
          $and: [
            { name: { $regex: req.query.q , '$options' : 'i' }  },
            { idNo: { $regex: req.query.no , '$options' : 'i'  } },
            { company_id: myUser.company_id },
            { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] }
          ]
        }
      },
      {
        $sort: {
          created_at: -1
        }
      }
    ])
    .toArray()

    return res.status(200).json({ success: true, data: payrolls })
}
