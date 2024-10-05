import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectToDatabase } from 'src/configs/dbConnect'
import { verifyPassword } from 'src/configs/auth'
import { ObjectId } from 'mongodb'

export const nextAuthOptions = (req, res) => {
  let selectedUser
  let client

  return {
    session: {
      jwt: true
    },

    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: 'Username', type: 'text', placeholder: 'jsmith' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {

          client = await connectToDatabase()
          credentials.email = credentials.email.toLowerCase();

          let user = await client.db().collection('users').aggregate([
            {
              $match :{
                $and:[
                  { email: credentials.email } ,   
                  { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] } 
                ]
              }
            },
            {
              $lookup:{
                from: 'subscriptions',
                let: { company_id:  '$company_id'  },
                pipeline: 
                [
                  { $match: { $expr: { $eq: ['$company_id', '$$company_id'] } } },
      
                  { $sort: { created_at : -1 } },
                ],
                as: 'subscriptions_info'
               }
               }
              ]
          ).toArray();
          if(!user || !user[0]){
            throw new Error('Wrong credentials!')
          }
          user = user[0];
          
          const isValid = await verifyPassword(credentials.password, user.password)
          
          if (!isValid) {
            throw new Error('Wrong credentials!')
          }
          
          if(user.status != 'active'){
              throw new Error('Your account is not active');
          }
          
          if(user?.type == 'manager'){
          
            if(user?.company_id){
              let company = await client.db().collection('companies').findOne({
                _id: ObjectId( user?.company_id) ,
                $or: [{deleted_at: {$exists: false}} , {deleted_at: null }]
              } );
          

              // if company is (pending or blocked)
          
              
              if( company?.status != 'active' ) {
                throw new Error('Your company is not active !') ;
              }
          
            }
            else{
              // if user doesn't belong to any company
          
              throw new Error('Account have no active company!');
            }
          }
          

          return user
        }
      })
    ],
    pages: {
      signIn: '/login/'
    },

    callbacks: {
      async redirect({ url, baseUrl }) {
        if (url) return Promise.resolve(url)

        return baseUrl
      },

      async jwt({ token, user, account, profile, isNewUser }) {
        return token
      },

      async session({ session, token, user }) {
        if (!session.user || !session.user._id) {

          const client = await connectToDatabase()
          
          const newUser = await client.db().collection('users').findOne({$and:[
            { email: token.email } ,   
            { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] } 
          ]} )
          session.user = newUser
        }

        return session
      }
    },
    theme: {
      colorScheme: 'light', // "auto" | "dark" | "light"
      brandColor: '#66cccc', // Hex color code
      logo: '', // Absolute URL to image
      buttonText: '' // Hex color code
    }
  }
}

export default (req, res) => {

  return NextAuth(req, res, nextAuthOptions(req, res))
}

// //-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// import NextAuth from 'next-auth'

// // import GoogleProvider from "next-auth/providers/google";
// // import FacebookProvider from "next-auth/providers/facebook";
// //import TwitterProvider from "next-auth/providers/twitter";
// import CredentialsProvider from 'next-auth/providers/credentials'
// //import AppleProvider from "next-auth/providers/apple";
// // import LinkedInProvider from "next-auth/providers/linkedin";
// import { connectToDatabase } from 'src/configs/dbConnect'
// import { verifyPassword } from 'src/configs/auth'

// export const nextAuthOptions = (req, res) => {
//   let client;
//   return {
//     //  adapter: MongoDBAdapter(clientPromise),
//     session: {
//       jwt: true,
//     },

//     providers: [
//       CredentialsProvider({
//         name: "Credentials",
//         credentials: {
//           email: { label: "Username", type: "text",  },
//           password: { label: "Password", type: "password" },
//         },
//         async authorize(credentials) {
//           client = await connectToDatabase();
//           let usersCollection = client.db().collection("users");
//           const user = await usersCollection.findOne({
//             email: credentials.email,
//           });

//           if (!user) {

//             throw new Error("No user found!");
//           }
//           const isValid = await verifyPassword(
//             credentials.password,
//             user.password
//           );
//           if (!isValid) {

//             throw new Error("Password invalid!");
//           }
//           return user;
//         },
//       }),

//     ],
//     callbacks: {
//       async redirect({ url, baseUrl }) {
//         if (url) return Promise.resolve(url);
//         return baseUrl;
//       },
//       async jwt({ token, user }) {
//        const client = await connectToDatabase();
//        const user1 = await client.db().collection('users').findOne({email:token.email})
//        token.user = user1;
//        return token;
//       },
//       async session({ session, token, user }) {
//         if (session?.user) {
//           session.user = token.user;
//         }

//         return session;
//       },
//     },
//     theme: {
//       colorScheme: "light", // "auto" | "dark" | "light"
//       brandColor: "#66cccc", // Hex color code
//       logo: "", // Absolute URL to image
//       buttonText: "", // Hex color code
//     },
//   };
// };
// export default (req, res) => {

//   return NextAuth(req, res, nextAuthOptions(req, res));
// };
