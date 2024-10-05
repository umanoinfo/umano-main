// ** React Imports
import { useState, forwardRef, useEffect, useCallback } from 'react'

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
import { Checkbox, Divider, FormControlLabel, FormGroup, FormLabel, ListItemText, Radio, RadioGroup, Switch } from '@mui/material'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Loading from 'src/views/loading'
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

const DialogAddUser = ({ id }) => {
  // ** States
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userStatus, setUserStatus] = useState('active')
  const [allRoles, setAllRoles] = useState([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('manager')
  const [roles, setRoles] = useState([])
  const [roleId , setRoleId] = useState() ;

  const [defaultValues, setDefaultValues] = useState({
    email: '',
    password: '',
    name: ''
  })
  const router = useRouter()

  const { data: session, status } = useSession()

  
  const getUser =  async (resolve) => {
     axios
      .get('/api/user/' + id, {})
      .then(function (response) {
        console.log(response.data.data[0]);
        setUserStatus(response.data.data[0].status)
        setType(response.data.data[0].type)
        setEmail(response.data.data[0].email)
        setName(response.data.data[0].name);
        setRoles(response.data.data[0].roles)
        if(response?.data?.data[0]?.type == 'manager'){
          if(response?.data?.data[0]?.roles?.[0])
            setRoleId(response.data.data[0].roles[0]);
        }
        reset(response.data.data[0])
        setLoading(false)
        resolve()
      })
      .catch(function (error) {
        setLoading(false)
      })
  }   ;

  const getRoles = async (resolve) => {
    
    axios
      .get('/api/role/', {})
      .then(function (response) {
        setAllRoles(response.data.data)
        resolve()

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



  useEffect( () => {
    setLoading(true);
    (new Promise((resolve,reject)=>getUser(resolve))).then(()=>{
      new Promise((resolve,reject)=>getRoles(resolve)).then(()=>{
        setLoading(false);
      })
    })
  }, [id])

  const [checked, setChecked] = useState(['wifi', 'location'])

  const handleToggle = value => () => {
    const currentIndex = checked.indexOf(value)
    const newChecked = [...checked]
    if (currentIndex === -1) {
      newChecked.push(value)
    } else {
      newChecked.splice(currentIndex, 1)
    }
    setChecked(newChecked)
  }
  
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

  const onSubmit = data => {
    console.log(roleId);
    setLoading(true)
    data.type = type
    if(type == 'admin'){
      data.roles = roles
    }
    else{
      if(roleId)
        data.roles = [roleId] ;
    }
    data.status = userStatus
    data.updated_at = new Date()
    axios
      .post('/api/user/edit-user', {
        data
      })
      .then(function (response) {
        dispatch(fetchData({})).then(() => {
          toast.success('User (' + data.name + ') Updated Successfully.', { delay: 1000, position: 'bottom-right' })
          router.push('/admin-dashboard/user')
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

  const handleChange = (event , roleId)=> {
    
    if(type== 'admin'){
      if (event.target.checked && !roles.includes(event.target.value)) {
        roles.push(event.target.value)
      } else {
        var index = roles.indexOf(event.target.value)
        if (index != -1) {
          roles.splice(index, 1)
        }
      }
    }
    setRoles([...roles])
  }

  if (loading) return <Loading header='Please Wait' description='User is loading'></Loading>

  if (session && !session.user && session.user.permissions.includes('AdminEditUser'))

    {return <NoPermission header='No Permission' description='No permission to View Users'></NoPermission>}

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Edit User' sx={{ pb: 1, '& .MuiCardHeader-title': { letterSpacing: '.1px' } }} />
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
                        defaultValue={name}
                        label='Name'
                        onChange={onChange}
                        placeholder='userName'
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
                        defaultValue={email}
                        label='Email'
                        onChange={onChange}
                        placeholder='name@email.com'
                        error={Boolean(errors.email)}
                      />
                    )}
                  />
                  {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
                </FormControl>

                <Grid container>
                  <Grid item sm={6} xs={12}>
                  { session.user._id != id &&
                    <FormControl fullWidth sx={{ mb: 6, pr: 2 }} size='small'>
                      <InputLabel id='status-select'>Select Status</InputLabel>
                      <Select
                        fullWidth
                        value={userStatus}
                        id='select-status'
                        label='Select Status'
                        labelId='status-select'
                        onChange={e => setUserStatus(e.target.value)}
                        inputProps={{ placeholder: 'Select Status' }}
                      >
                        <MenuItem value='active'>Active</MenuItem>
                        <MenuItem value='pending'>Pending</MenuItem>
                        <MenuItem value='blocked'>Blocked</MenuItem>
                      </Select>
                    </FormControl>
                    }
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
                                  <Switch checked={roles.includes(role._id,'')} onChange={handleChange} value={role._id} />
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
                      <Button color='success' type='submit' variant='contained' sx={{ mr: 3 }}>
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

DialogAddUser.getInitialProps = async ({ query: { id } }) => {
  return { id: id }
}

export default DialogAddUser
