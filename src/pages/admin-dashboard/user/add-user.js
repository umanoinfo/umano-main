// ** React Imports
import { useState, forwardRef, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Fade from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormHelperText from '@mui/material/FormHelperText'
import Select from '@mui/material/Select'
import toast from 'react-hot-toast'

// ** Third Party Imports
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Axios Imports
import axios from 'axios'

// ** Actions Imports
import { fetchData, deleteUser } from 'src/store/apps/user'

// ** Store Imports
import { useDispatch } from 'react-redux'
import { addUser } from 'src/store/apps/user'
import { Checkbox, Divider, FormControlLabel, FormGroup, FormLabel, RadioGroup, Switch } from '@mui/material'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import NoPermission from 'src/views/noPermission'

const showErrors = (field, valueLen, min) => {
  if (valueLen === 0) {
    return `${field} field is required`
  } else if (valueLen > 0 && valueLen < min) {
    return `${field} must be at least ${min} characters`
  } else {
    return ''
  }
}

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup
    .string()
    .min(6, obj => showErrors('Password', obj.value.length, obj.min))
    .required(),
  name: yup
    .string()
    .min(3, obj => showErrors('Name', obj.value.length, obj.min))
    .required()
})

const defaultValues = {
  email: '',
  password: '',
  name: ''
}

const DialogAddUser = () => {
  // ** States
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userStatus, userUserStatus] = useState('active')
  const [type, setType] = useState('manager')
  const [roles, setRoles] = useState([])
  const [allRoles ,setAllRoles] = useState([]);
  const [roleId , setRoleId] = useState() ;
  const router = useRouter()

  const { data: session, status } = useSession()

  // const handleChange = event => {
  //   const {
  //     target: { value }
  //   } = event
  //   setLanguages(typeof value === 'string' ? value.split(',') : value)
  // }

  const dispatch = useDispatch()

  const {
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const getRoles = () => {
    setLoading(true)
    axios
      .get('/api/role/', {})
      .then(function (response) {
        setAllRoles(response.data.data)
        setLoading(false)
      })
      .catch(function (error) {
        setLoading(false)
        console.log(error);
        let message = error?.response?.data?.message || error.toString();
        if(message == 'Not Auth'){
          message = 'Error : failed to fetch roles (you do not have permission to view roles)';
        }
        toast.error(message , {duration: 5000 , position:'bottom-right'}) ;

      })
    }
  
  useEffect(()=>{
    getRoles();
  }, [])

  const onSubmit = data => {
    setLoading(true)
    data.type = type
    data.status = userStatus
    data.permissions = []
    if(type == 'admin'){
      data.roles = roles ;
    }
    else{
      data.roles = [roleId] ; 
    }
    data.created_at = new Date()
    axios
      .post('/api/user/add-user', {
        data
      })
      .then(function (response) {
        dispatch(fetchData({})).then(() => {
          toast.success('User (' + data.name + ') Inserted Successfully.', { delay: 1000, position: 'bottom-right' })
          setLoading(false)
          reset()
        })
      })
      .catch(function (error) {
        toast.error('Error : ' + error.response.data.message + ' !', {
          delay: 1000,
          position: 'bottom-right'
        })
        setLoading(false)
      })
  }

  const close = () => {
    router.push('/admin-dashboard/user')
  }

  if (session && session.user && !session.user.permissions.includes('AdminAddUser'))
    return <NoPermission header='No Permission' description='No permission to Add Users'></NoPermission>

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Add User' sx={{ pb: 1, '& .MuiCardHeader-title': { letterSpacing: '.1px' } }} />
            <CardContent></CardContent>
            <Divider />
            <Grid item xs={12} sm={5} md={5} sx={{ p: 2, mb: 5 }}>
              <form onSubmit={handleSubmit(onSubmit)} sx={{ mb: 12 }}>
                <FormControl fullWidth sx={{ mb: 6 }}>
                  <Controller
                    name='name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        size='small'
                        value={value}
                        label='Name'
                        onChange={onChange}
                        placeholder='name'
                        error={Boolean(errors.usernnameme)}
                      />
                    )}
                  />
                  {errors.username && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.username.message}</FormHelperText>
                  )}
                </FormControl>

                <FormControl fullWidth sx={{ mb: 6 }}>
                  <Controller
                    name='email'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        type='email'
                        size='small'
                        value={value}
                        label='Email'
                        onChange={onChange}
                        placeholder='name@email.com'
                        error={Boolean(errors.email)}
                      />
                    )}
                  />
                  {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth sx={{ mb: 6 }}>
                  <Controller
                    name='password'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        type='password'
                        size='small'
                        value={value}
                        label='Password'
                        onChange={onChange}
                        placeholder='xxxxxx'
                        error={Boolean(errors.password)}
                      />
                    )}
                  />
                  {errors.password && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.password.message}</FormHelperText>
                  )}
                </FormControl>

                <Grid container spacing={6}>
                  <Grid item sm={6} xs={12}>
                    <FormControl fullWidth sx={{ mb: 6 }} size='small'>
                      <InputLabel id='userStatus-select'>Select Status</InputLabel>
                      <Select
                        fullWidth
                        value={userStatus}
                        id='select-userStatus'
                        label='Select Status'
                        labelId='userStatus-select'
                        onChange={e => userUserStatus(e.target.value)}
                        inputProps={{ placeholder: 'Select Status' }}
                      >
                        <MenuItem value='active'>Active</MenuItem>
                        <MenuItem value='pending'>Pending</MenuItem>
                        <MenuItem value='blocked'>Blocked</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item sm={6} xs={12}>
                    <FormControl fullWidth sx={{ mb: 6 }} size='small'>
                      <InputLabel id='type-select'>Select Type</InputLabel>
                      <Select
                        fullWidth
                        value={type}
                        id='select-type'
                        label='Select Type'
                        labelId='type-select'
                        onChange={e => setType(e.target.value)}
                        inputProps={{ placeholder: 'Select Type' }}
                      >
                        <MenuItem value='admin'>Admin</MenuItem>
                        <MenuItem value='manager'>Manager</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item sm={12} xs={12}>
                    <FormControl fullWidth sx={{ mb: 6, mx: 1 }} size='small'>
                      <FormLabel component='legend'>Roles</FormLabel>
                      <FormGroup sx={{ mx: 6 }}>
                        {allRoles && type =='admin' &&
                          allRoles.map((role , index) => {
                            
                            return (
                              <FormControlLabel
                              key = {index}
                                control={
                                  <Switch checked={roles.includes(role._id,'')} onChange={(e)=>{
                                    let exist = false ;
                                    e = e.target.value ;
                                    console.log(e)
                                    roles.map((id)=>{
                                      console.log(id, e ) ;
                                      if(id == e){
                                        exist= true ;
                                      }
                                    })
                                    console.log(exist);
                                    let newRoles = [...roles];
                                    if(!exist){
                                      newRoles = [...roles , e ];
                                    }
                                    else{
                                      newRoles = roles.filter((id)=> id != e)
                                    }
                                    setRoles(newRoles);
                                    console.log(newRoles);
                                  }} value={role._id} />
                                }
                                label={role.title}
                              />
                            )
                          })}
                        <RadioGroup sx={{ mx: 6 }}>
                        {allRoles && type == 'manager' &&
                          allRoles.map((role , index) => {
                            
                            return (
                              <FormControlLabel
                                  key = {index}
                                  control={
                                    
                                    <Checkbox
                                      value={role._id}
                                      checked={role._id == roleId }
                                      onChange={()=> setRoleId(role._id)}
                                    />
                                  }
                                  label={role.title}
                              />
                            )
                          })}

                        {/* <Switch checked={roles.includes(role._id)} onChange={handleChange} value={role._id} /> */}
                      </RadioGroup>
                      </FormGroup>
                    </FormControl>
                  </Grid>
                </Grid>
                <Box sx={{ mb: 2, alignItems: 'center' }}>{loading && <LinearProgress />}</Box>

                <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                  {!loading && (
                    <>
                      <Button color='success' type='submit' variant='contained' sx={{ mr: 3 }}  >
                        Save
                      </Button>
                      <Button type='button' color='warning' variant='contained' sx={{ mr: 3 }} onClick={() => close()}>
                        Close
                      </Button>
                    </>
                  )}
                </Box>
              </form>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default DialogAddUser
