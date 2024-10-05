import { connectToDatabase } from 'src/configs/dbConnect'
import { getToken } from 'next-auth/jwt'

export default async function handler(req, res) {
  const client = await connectToDatabase()

  if (!req.query.deductionType) {
    req.query.deductionType = ''
  }
  if (!req.query.deductionStatus) {
    req.query.deductionStatus = ''
  }
  if (!req.query.q) {
    req.query.q = ''
  }

  // -------------------- Token --------------------------------------------------

  const token = await getToken({ req })
  const myUser = await client.db().collection('users').findOne({ email: token.email })
  if (!myUser || !myUser.permissions || !myUser.permissions.includes('ViewEmployeeDeduction')) {
    return res.status(401).json({ success: false, message: 'Not Auth' })
  }

  // --------------------- Post ------------------------------------------
  const employees_ = await client.db().collection('employees').find({
    $or: [{ firstName: { $regex: req.query.q, '$options' : 'i'  } }, { lastName: { $regex: req.query.q , '$options' : 'i'  } } , { idNo: { $regex: req.query.q , '$options' : 'i'  } }] 
    
    
   }).toArray();

   const ids = employees_.map((emp)=>{
     
     return {employee_id : String(emp._id) };
   });

  const employees = await client
    .db()
    .collection('employeeDeductions')
    .aggregate([
      {
        $match: {
          $and: [
            { reason: { $regex: req.query.q , '$options' : 'i' } },
            
            { $or: ids },
            { type: { $regex: req.query.deductionType } },
            { status: { $regex: req.query.deductionStatus } },
            { company_id: myUser.company_id },
            { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] }
          ]
        }
      },
      {
        $lookup: {
          from: 'employees',
          let: { employee_id: { $toObjectId: '$employee_id' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$employee_id'] } } }],
          as: 'employee_info'
        }
      },
      {
        $sort: {
          created_at: -1
        }
      }
    ])
    .toArray()

  return res.status(200).json({ success: true, data: employees })
}
