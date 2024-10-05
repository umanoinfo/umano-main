import { ObjectId } from 'mongodb'
import { getToken } from 'next-auth/jwt'
import { connectToDatabase } from 'src/configs/dbConnect'

export default async function handler(req, res) {
  if(req.method != 'POST'){
    return res.status(405).json({success: false , message: 'Method is not allowed'});
  }

  const client = await connectToDatabase()

  // ---------------- Token ----------------

  const token = await getToken({ req })
  const myUser = await client.db().collection('users').findOne({ email: token.email })
  if (!myUser || !myUser.permissions || !myUser.permissions.includes('DeleteRole')) {
    return res.status(401).json({ success: false, message: 'Not Auth' })
  }

  // ---------------- Delete --------------------

  const role = req.body.selectedRole
  const id = role._id
  delete role._id


  const selectedRole = await client
    .db()
    .collection('roles')
    .findOne({ _id: ObjectId(id) , company_id: myUser.company_id.toString() })
  if(!selectedRole){
    return res.status(404).json({success: false, message: 'Role not found'});
  }

  if (selectedRole && selectedRole.deleted_at) {
    const deletRole = await client
      .db()
      .collection('roles')
      .updateOne({ _id: ObjectId(id) }, { $set: { deleted_at: '' } }, { upsert: false })

    // ---------------- logBook ----------------

    let log = {
      user_id: req.body.user._id,
      company_id: req.body.user.company_id,
      Module: 'Role',
      Action: 'Delete',
      Description: 'Restore role (' + selectedRole.title + ')',
      created_at: new Date()
    }
    const newlogBook = await client.db().collection('logBook').insertOne(log)
  } else {
    const deletRole = await client
      .db()
      .collection('roles')
      .updateOne({ _id: ObjectId(id) }, { $set: { deleted_at: new Date() } }, { upsert: false })

    // ---------------- logBook ----------------

    let log = {
      user_id: req.body.user._id,
      company_id: req.body.user.company_id,
      Module: 'Role',
      Action: 'Delete',
      Description: 'Delete role (' + selectedRole.title + ')',
      created_at: new Date()
    }
    const newlogBook = await client.db().collection('logBook').insertOne(log)
  }

  const users = await client
    .db()
    .collection('users')
    .aggregate([
      {
        $match: {
          roles: { $elemMatch: { $eq: id } }
        }
      }
    ])
    .toArray()

  for (const user of users) {
    var index = user.roles.indexOf(id)
    user.roles.splice(index, 1)

    user.permissions = []
    const user_id = user._id

    for (const role_id of user.roles) {
      const selectedRole = await client
        .db()
        .collection('roles')
        .findOne({ _id: ObjectId(role_id) })
      if (selectedRole && selectedRole.permissions) {
        for (const permission of selectedRole.permissions) {
          if (!user.permissions.includes(permission)) {
            user.permissions.push(permission)
          }
        }
      }
    }
    
    delete user._id
    
    const updatedUser = await client
      .db()
      .collection('users')
      .updateOne({ _id: ObjectId(user_id) }, { $set: user }, { upsert: false })
  }

  return res.status(201).json({ success: true, data: users })
}
