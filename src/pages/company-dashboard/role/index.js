// ** MUI Imports
import { CardHeader, DialogContentText, Divider, LinearProgress } from '@mui/material'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Checkbox from '@mui/material/Checkbox'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import DialogTitle from '@mui/material/DialogTitle'
import CardContent from '@mui/material/CardContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import TableContainer from '@mui/material/TableContainer'
import FormControlLabel from '@mui/material/FormControlLabel'
import { Breadcrumbs } from '@mui/material'

import Icon from 'src/@core/components/icon'
import Loading from 'src/views/loading'

import { fetchData } from 'src/store/apps/companyRole'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'

import { useSession } from 'next-auth/react'
import NoPermission from 'src/views/noPermission'

// ** Next Imports
import Link from 'next/link'

const RolesComponent = () => {
  // ** States
  const [open, setOpen] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('Add')
  const handleClickOpen = () => setOpen(true)
  const handleDeleteOpen = () => setOpenDeleteDialog(true)
  const [selectedRole, setSelectedRole] = useState()
  const [value, setValue] = useState('')
  const [title, setTitle] = useState('')
  const [permissionsGroup, setPermissionsGroup] = useState([])
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [permissionsLength , setPermissionsLength ] = useState(0) ;
  const [groupCheckboxDisabled , setGroupCheckboxDisabled ] = useState([]);
  const dispatch = useDispatch()
  const store = useSelector(state => state.companyRole)
  const { data: session, status } = useSession()


  const handleClose = () => {
    setOpen(false)
    setSelectedPermissions([])
    setTitle('')
  }

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false)
    setSelectedPermissions([])
    setTitle('')
  }

  // ------------------------ Get Permission Group ------------------------------------

  const getPermissionGroup = async () => {
    setLoading(true);
    axios
      .get('/api/permission/company-premission-group', {})
      .then(function (response) {
        setPermissionsGroup(response.data.data)
        let count = 0 ;
        response.data.data.map((group)=>{
          let groupPermissionsCount =0 ;
          group.permissions.map((permission)=>{
            count++ ;
            if(session.user.permissions.includes(permission.alias))
              groupPermissionsCount++ ;
          })
          console.log(group._id , groupPermissionsCount , group.permission.length ) ;
          if(groupPermissionsCount != group.permissions.length ){
            setGroupCheckboxDisabled([...groupCheckboxDisabled , group._id]);
          }
        })

        setPermissionsLength(count);
        setLoading(false);

        // resolve()
        
      })
      .catch(function (error) {
        setLoading(false);
      })
  }

  useEffect(() => {

    setLoading(true);
    dispatch(
      fetchData({
        q: value
      })
    ).then( () =>{
      getPermissionGroup()
    })
  }, [dispatch, value])

 
  // ------------------------ Change Permission ------------------------------------

  const changePermission = e => {
    if (e.target.checked && !selectedPermissions.includes(e.target.id)) {
      selectedPermissions.push(e.target.id)
      setSelectedPermissions([...selectedPermissions])
    }
    if (!e.target.checked && selectedPermissions.includes(e.target.id)) {
      var index = selectedPermissions.indexOf(e.target.id)
      selectedPermissions.splice(index, 1)
      setSelectedPermissions([...selectedPermissions])
    }
  }

  // ------------------------ Edit Role ------------------------------------

  const handelEdit = role => {
    setSelectedRole(role)
    setTitle(role.title)
    setSelectedPermissions([...role.permissions])
    handleClickOpen()
    setDialogTitle('Edit')
  }

  const update = () => {
    setLoading(true)
    let data = {}
    data._id = selectedRole.id
    data.title = title
    data.permissions = selectedPermissions
    data.type = 'company'
    data.company_id = session.user.company_id
    data.updated_at = new Date()
    axios
      .post('/api/company-role/edit-role', {
        data: data,
        user: session.user
      })
      .then(function (response) {
        dispatch(fetchData({})).then(() => {
          toast.success('Role (' + selectedRole.title + ') Updated Successfully.', {
            delay: 3000,
            position: 'bottom-right'
          })

          for (const user of response.data.data) {
            toast.success('User (' + user.name + ') Updated Permissions.', { delay: 3000, position: 'bottom-right' })
          }
          setLoading(false)
          handleClose()
        })
      })
      .catch(function (error) {
        toast.error('Error : ' + error.response.data.message + ' !', {
          delay: 2000,
          position: 'bottom-right'
        })
        setLoading(false)
      })
  }

  const changeGroupPermissions = (e , _id ) => {
    permissionsGroup.map((group, index ) =>{
       
      if(group._id == _id ){
        
        group.permissions.map((permission , index ) => {
          if(e.target.checked && !selectedPermissions.includes(permission.alias) && session.user.permissions.includes(permission.alias)){
              selectedPermissions.push(permission.alias);
          }
          if(!e.target.checked && selectedPermissions.includes(permission.alias) && session.user.permissions.includes(permission.alias) ){
            const index = selectedPermissions.indexOf(permission.alias);
            selectedPermissions.splice(index , 1 ) ; 
          }
        })
        setSelectedPermissions([...selectedPermissions]);
      }
    });
    
  }

  const allChecked = ()=>{
    let count = 0 ;
    permissionsGroup.map((group, index ) =>{
        group.permissions.map((permission , index ) => {
            count++;
        })
    });

    return count == selectedPermissions.length ;
  }

  const checkAll = (e)=>{
    if(e.target.checked){
      let selected = [] ;
      permissionsGroup.map((group, index ) =>{
        group.permissions.map((permission , index ) => {
          if(session.user.permissions.includes(permission.alias))
              selected.push(permission.alias);
        })
      });
      setSelectedPermissions([...selected]);
    }
    else{
      setSelectedPermissions([]) ;
    }
  }
  
  const groupPermissionsSelected = (_id) =>{
    permissionsGroup.map((group, index ) =>{
      if(group._id == _id ){
        let count = 0 ;
        group.permissions.map((permission , index ) => {
          if(selectedPermissions.includes(permission.alias)){
              count++ ;
          }
         
        })
        if(count == permissionsGroup.permissions.length ){
          return true ;
        }
      }
    });

    return false ;
  }

  // ------------------------ Delete Role ------------------------------------

  const handelDelete = role => {
    setSelectedRole(role)
    handleDeleteOpen()
  }

  const deleteRole = () => {
    setLoading(true)
    axios
      .post('/api/company-role/delete-role', {
        selectedRole: selectedRole,
        user: session.user
      })
      .then(function (response) {
        dispatch(fetchData({})).then(() => {
          toast.success('Role (' + selectedRole.title + ') Deleted Successfully.', {
            delay: 3000,
            position: 'bottom-right'
          })
          setOpenDeleteDialog(false)
          setLoading(false)
        })
      })
      .catch(function (error) {
        toast.error('Error : ' + error.response.data.message + ' !', {
          delay: 3000,
          position: 'bottom-right'
        })
        setLoading(false)
      })
  }

  // ------------------------ Add Role ------------------------------------

  const saveNew = () => {
    setLoading(true)
    let data = {}
    data.title = title
    data.permissions = selectedPermissions
    data.type = 'company'
    data.company_id = session.user.company_id
    data.status = 'Active'
    data.created_at = new Date()
    axios
      .post('/api/company-role/add-role', {
        data: data,
        user: session.user
      })
      .then(function (response) {
        dispatch(fetchData({})).then(() => {
          toast.success('Role (' + data.title + ') Inserted Successfully.', { delay: 2000, position: 'bottom-right' })
          setLoading(false)
          setTitle('')
        })
      })
      .catch(function (error) {
        toast.error('Error : ' + error.response.data.message + ' !', {
          delay: 2000,
          position: 'bottom-right'
        })
        setLoading(false)
      })
  }

  // -------------------------- Render Cards -------------------------------------------------
  const renderCards = () =>
    store.data.map((role, index) => (
      <Grid item xs={12} sm={6} lg={4} key={index}>
        <Card>
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* <Typography variant='body2'>{`Total 2 users`}</Typography> */}
              {/* <Typography variant='body2'>{`Total ${role.users} users`}</Typography> */}
              {/* <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 40, height: 40, fontSize: '0.875rem' } }}>
                {item.avatars.map((img, index) => (
                  <Avatar key={index} alt={item.title} src={`/images/avatars/${img}`} />
                ))}
              </AvatarGroup> */}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant='h5'>{role.title}</Typography>
                {role.permissions && (
                  <Typography
                    variant='body2'
                    sx={{ color: 'primary.main' }}
                  >{`Permissions :  ${role.permissions.length} `}</Typography>
                )}
              </Box>
              <div>
                {session && session.user.permissions.includes('EditRole') && (
                  <IconButton onClick={e => handelEdit(role)} sx={{ color: 'text.secondary' }}>
                    <Icon icon='mdi:edit-outline' fontSize={20} />
                  </IconButton>
                )}
                {session && session.user.permissions.includes('DeleteRole') && (
                  <IconButton onClick={e => handelDelete(role)} sx={{ color: 'text.secondary' }}>
                    <Icon icon='mdi:delete-outline' fontSize={20} />
                  </IconButton>
                )}
              </div>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))

  if (loading) return <Loading header='Please Wait' description='Roles are loading'></Loading>
  if (session && session.user && !session.user.permissions.includes('ViewRole')) {
    return <NoPermission header='No Permission' description='No permission to View Roles'></NoPermission>
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
        <Breadcrumbs aria-label='breadcrumb' sx={{ pb: 0, p: 3 }}>
            <Link underline='hover' color='inherit' href='/'>
              Home
            </Link>
            <Typography color='text.primary' sx={{ fontSize: 18, fontWeight: '500' }}>
              Roles List
            </Typography>
          </Breadcrumbs>          <Divider />

          <Grid item xs={12} sx={{ m: 5 }}>
            <Grid container spacing={6} className='match-height'>
              {renderCards()}
              {session && session.user.permissions.includes('AddRole') && (
                <Grid item xs={12} sm={6} lg={4}>
                  <Card
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      handleClickOpen()
                      setDialogTitle('Add')
                    }}
                  >
                    <Grid container sx={{ height: '100%' }}>
  
                      <Grid item xs={12}>
                        <CardContent>
                          <Box sx={{ textAlign: 'center' }}>
                            <Button
                              variant='contained'
                              sx={{ mb: 2.5, whiteSpace: 'nowrap' }}
                              onClick={() => {
                                handleClickOpen()
                                setDialogTitle('Add')
                              }}
                            >
                              Add Role
                            </Button>
                            <Typography variant='body2'>Add role, if it doesn't exist.</Typography>
                          </Box>
                        </CardContent>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              )}
              
              {/* --------------------------------------- ADD Edit Dialog ------------------------------------------- */}
              <Dialog fullWidth maxWidth='md' scroll='body' onClose={handleClose} open={open}>
                <DialogTitle sx={{ textAlign: 'center' }}>
                  <Typography variant='h5' component='span'>
                    {`${dialogTitle} Role`}
                  </Typography>
                  <Typography variant='body2'>Set Role Permissions</Typography>
                </DialogTitle>
                <DialogContent sx={{ p: { xs: 6, sm: 12 } }}>
                  <Box sx={{ my: 4 }}>
                    <FormControl fullWidth>
                      <TextField
                        value={title}
                        onChange={e => {
                          setTitle(e.target.value)
                        }}
                        label='Role Name'
                        placeholder='Enter Role Name'
                      />
                    </FormControl>
                  </Box>
                  <TableContainer>
                    <Table size='small'>
                      <TableHead></TableHead>
                      <TableBody>
                      <Checkbox 
                            check={()=>allChecked()}
                            size='small'
                            onChange={ (e) => checkAll(e)}
                        />
                        Choose all
                        {permissionsGroup &&
                          permissionsGroup.map((group, index) => {
                            return (
                              <TableRow
                                key={index}
                                sx={{ '& .MuiTableCell-root:first-of-type': { pl: '0 !important' } }}
                              >
                                <TableCell
                                  sx={{
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    color: theme => `${theme.palette.text.primary} !important`
                                  }}
                                >
                                  <Checkbox 
                                    check={()=>groupPermissionsSelected(group._id)}
                                    size='small'

                                    // disabled={groupCheckboxDisabled.includes(group._id)}
                                    id={group._id}
                                    onChange={e => changeGroupPermissions(e , group._id)}
                                  />
                                  {group._id}
                                </TableCell>

                                <TableCell>
                                  {group.permissions.map((permission, index) => {
                                    return (
                                      <>
                                        <FormControlLabel
                                          sx={{ pr: 5 }}
                                          label={permission.title}
                                          control={
                                            <Checkbox
                                              checked={selectedPermissions.includes(permission.alias) && session.user.permissions.includes(permission.alias)}
                                              size='small'
                                              disabled={!session.user.permissions.includes(permission.alias)}
                                              id={permission.alias}
                                              onChange={e => changePermission(e)}
                                            />
                                          }
                                        />
                                      </>
                                    )
                                  })}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </DialogContent>
                <Box sx={{ mb: 2, alignItems: 'center' }}>{loading && <LinearProgress />}</Box>
                {!loading && (
                  <DialogActions sx={{ pt: 0, display: 'flex', justifyContent: 'center' }}>
                    <Box className='demo-space-x'>
                      {dialogTitle == 'Add' && (
                        <Button size='large' variant='contained' onClick={saveNew}>
                          Add
                        </Button>
                      )}
                      {dialogTitle == 'Edit' && (
                        <Button size='large' variant='contained' onClick={update}>
                          Update
                        </Button>
                      )}
                      <Button size='large' color='secondary' variant='outlined' onClick={handleClose}>
                        Cancel
                      </Button>
                    </Box>
                  </DialogActions>
                )}
              </Dialog>
              {/* -----------------------------  --------- Delete Dialog ------------------------------------------------------- */}
              <Dialog
                open={openDeleteDialog}
                disableEscapeKeyDown
                aria-labelledby='alert-dialog-title'
                aria-describedby='alert-dialog-description'
                onClose={(event, reason) => {
                  if (reason !== 'backdropClick') {
                    handleClose()
                  }
                }}
              >
                <DialogTitle id='alert-dialog-title text'>Warning</DialogTitle>
                <DialogContent>
                  <DialogContentText id='alert-dialog-description'>
                    Are you sure , you want to delete role{' '}
                    <span className='bold'>{selectedRole && selectedRole.title}</span>
                  </DialogContentText>
                </DialogContent>
                <DialogActions className='dialog-actions-dense'>
                  <Button onClick={deleteRole}>Yes</Button>
                  <Button onClick={handleDeleteClose}>No</Button>
                </DialogActions>
              </Dialog>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </Grid>
  )
}

export default RolesComponent
