// ** React Imports
import { useState, Fragment, useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useSession } from 'next-auth/react'


// ** Icon Imports
import Icon from 'src/@core/components/icon'

import { signOut } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { LinearProgress } from '@mui/material'

// ** Styled Components
const BadgeContentSpan = styled('span')(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
}))

const UserDropdown = props => {
  // ** Props
  const { settings } = props

  // ** States
  const [anchorEl, setAnchorEl] = useState(null)
  const [loading , setLoading] = useState();

  // ** Hooks
  const router = useRouter()

  // ** Vars
  const { direction } = settings

  const handleDropdownOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = url => {
    if (url && router.pathname != url) {
      router.push(url)
    }
    setAnchorEl(null)
  }

  const { data: session, status } = useSession()
  const [roles , setRoles ] = useState([]);

  const getRoles = async ()=>{
    setLoading(true);
    try{
      let res = await axios.get('/api/user/roles');
      
      if(res?.data?.success== true ){
        let roles = res?.data?.data;
        if(Array.isArray(roles) && roles && roles?.toString()){
          setRoles(roles) ; 
        }
        setLoading(false);
      }
    }
    catch(err){
      toast.error(err.toString() , {delay:1000 , position:'bottom-right'});
      setLoading(false);
    }

  }

  useEffect( ()=>{
    
      getRoles() ;
    
  }, []) ;

  const styles = {
    py: 2,
    px: 4,
    width: '100%',
    display: 'block',
    alignItems: 'center',
    color: 'text.primary',
    textDecoration: 'none',
    '& svg': {
      mr: 2,
      fontSize: '1.375rem',
      color: 'text.primary'
    }
  }

  const handleLogout = () => {
    router.push('/login').then(() => {
      signOut()
    })
  }
  if(loading){
    return <LinearProgress></LinearProgress>
  }
  
  return (
    <Fragment>
      <Badge
        overlap='circular'
        onClick={handleDropdownOpen}
        sx={{ ml: 2, cursor: 'pointer' }}
        badgeContent={<BadgeContentSpan />}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <Avatar
          alt='John Doe'
          onClick={handleDropdownOpen}
          sx={{ width: 40, height: 40 }}
          src='/images/avatars/1.png'
        />
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ '& .MuiMenu-paper': { width: 230, mt: 4 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'ltr' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: direction === 'ltr' ? 'right' : 'left' }}
      >
        <Box sx={{ pt: 2, pb: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              overlap='circular'
              badgeContent={<BadgeContentSpan />}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
            >
              <Avatar alt='John Doe' src='/images/avatars/1.png' sx={{ width: '2.5rem', height: '2.5rem' }} />
            </Badge>
            <Box sx={{ display: 'flex', ml: 3, alignItems: 'flex-start', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 600 }}>{session?.user?.name}</Typography>
              <Typography variant='body2' sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                {session?.user?.email}
              </Typography>
              <Typography variant='body2' sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                {session?.user?.type}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mt: '0 !important' }} />
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/pages/user-profile/profile')}>
          <Box sx={styles}>
            <Icon icon='mdi:account-outline' />
            Profile
          </Box>
        </MenuItem> */}
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/apps/email')}>
          <Box sx={styles}>
            <Icon icon='mdi:email-outline' />
            Inbox
          </Box>
        </MenuItem> */}
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/apps/chat')}>
          <Box sx={styles}>
            <Icon icon='mdi:message-outline' />
            Chat
          </Box>
        </MenuItem> */}
        {/* <Divider /> */}
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/pages/account-settings/account')}>
          <Box sx={styles}>
            <Icon icon='mdi:cog-outline' />
            Settings
          </Box>
        </MenuItem> */}
        {/* <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/pages/pricing')}>
          <Box sx={styles}>
            <Icon icon='mdi:currency-usd' />
            Pricing
          </Box>
        </MenuItem> */}
        <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/forgot-password')}>
          <Box sx={styles}>
            <Icon icon='mdi:cog-outline' />
            Change Password
          </Box>
        </MenuItem>
        {/* <Divider />
        <MenuItem sx={{ p: 0 }} >
          <Box sx={styles}  >
            <Icon icon='mdi-security-network' />
             {session.user.type}
          </Box>
        </MenuItem> */}
        <Divider />
        <MenuItem sx={{ p: 0 }} >
          <Box sx={styles}  >
            <Icon icon='mdi-account' style={{display:'flex' , flexWrap:'wrap'}} />

             {
              roles?.map((role)=>{
                  return <>
                    <span style={{display:'flex', flexWrap:'wrap'}} >
                      {role.toString()}
                    </span>
                  </>
              })
             }
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{ py: 2, '& svg': { mr: 2, fontSize: '1.375rem', color: 'text.primary' } }}
        >
          <Icon icon='mdi:logout-variant' />
          Logout
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export default UserDropdown
