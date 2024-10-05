// ** React Imports
import { useState, forwardRef, useEffect, useRef } from 'react'

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
import Link from '@mui/material/Link'
import { styled } from '@mui/material/styles'

import { Input, InputGroup, Row, Col } from 'rsuite'
import { Form, Schema, Panel } from 'rsuite'
import { DatePicker } from 'rsuite'
import 'rsuite/dist/rsuite.min.css'

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

import Autocomplete from '@mui/material/Autocomplete'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Store Imports
import { useDispatch } from 'react-redux'
import { addUser } from 'src/store/apps/user'
import { Avatar, Divider, InputAdornment } from '@mui/material'
import { useRouter } from 'next/router'

// ** Third Party Imports
import { useDropzone } from 'react-dropzone'
import subDays from 'date-fns/subDays'
import addDays from 'date-fns/addDays'
import CustomInputs from 'src/views/forms/form-elements/pickers/PickersCustomInput'
import { padding } from '@mui/system'

// ** Data
import { companiesTypes } from 'src/local-db'

// ** CleaveJS Imports
import Cleave from 'cleave.js/react'
import 'cleave.js/dist/addons/cleave-phone.us'

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
  // country: yup.object().required(),
  phone: yup.string().required(),
  address: yup
    .string()
    .min(10, obj => showErrors('Name', obj.value.length, obj.min))
    .required(),
  name: yup
    .string()
    .min(3, obj => showErrors('Name', obj.value.length, obj.min))
    .required()
})

const defaultValues = {}

const DialogAddUser = ({ popperPlacement }) => {
  // ** States
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('active')
  const [type, setType] = useState(companiesTypes[0])
  const [files, setFiles] = useState([])
  const [minDate, setMinDate] = useState(new Date())
  const [maxDate, setMaxDate] = useState(new Date())
  const [date, setDate] = useState(new Date())
  const [logo, setLogo] = useState()
  const router = useRouter()
  const inputFile = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [usersDataSource, setUsersDataSource] = useState([])
  const [countriesDataSource, setCountriesDataSource] = useState([])
  const [country, setCountry] = useState()
  const [countryIndex, setCountryIndex] = useState()
  const [end_at, setEnd_at] = useState(new Date().toISOString().substring(0, 10))
  const [start_at, setStart_at] = useState(new Date().toISOString().substring(0, 10))
  const [userID, setUserId] = useState()
  const [usersCount, setUsersCount] = useState(1)
  const [formError, setFormError] = useState({})

  const [formValue, setFormValue] = useState({
    name: ''
  })

  const dispatch = useDispatch()

  const formRef = useRef()

  const { StringType } = Schema.Types
  
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

  useEffect(() => {}, [])

  const model = Schema.Model({
    users: StringType().isRequired('This phone is required.')
  })

  // ----------------------------- Get Countries ----------------------------------

  const getCountries = async () => {
    try{
    setIsLoading(true)
    const res = await fetch('/api/country')
    const { data } = await res.json()
    setIsLoading(false)
    setCountriesDataSource(data)
    const index = data.map(e => e._id).indexOf('618e8986133c2b25923f2248')
    setCountryIndex(index)
    setCountry(data[index])
    }
    catch(err){
        
    }
  }

  const uploadImage = async event => {
    const file = event.target.files[0]
    const base64 = await convertBase64(file)
    setLogo(base64)
  }

  const onSubmit = data => {
    setLoading(true)
    data.type = type.value
    data.country_id = country._id
    data.start_at = start_at
    data.user_id = userID
    data.end_at = end_at
    data.status = status
    data.logo = logo
    data.created_at = new Date()
    axios
      .post('/api/company/add-company', {
        data
      })
      .then(function (response) {
        dispatch(fetchData({})).then(() => {
          toast.success('Company (' + data.name + ') Inserted Successfully.', { delay: 3000, position: 'bottom-right' })
          router.push('/admin-dashboard/company')
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

  const test = e => {}

  const close = () => {
    router.push('/admin-dashboard/user')
  }

  const convertBase64 = file => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)

      fileReader.onload = () => {
        resolve(fileReader.result)
      }

      fileReader.onerror = error => {
        reject(error)
      }
    })
  }

  const openUpload = () => {
    inputFile.current.click()
  }

  const handleTypeChange = (event, newValue) => {
    setType(newValue.value)
  }

  const handleUserChange = (event, newValue) => {
    setUserId(newValue._id)
  }

  const handleCountryChange = (event, newValue) => {
    setCountry(newValue._id)
  }

  return (
    <>
      <Grid item xs={12} sm={7} lg={7}></Grid>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Add Subscription' sx={{ pb: 1, '& .MuiCardHeader-title': { letterSpacing: '.1px' } }} />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 5 }}>
                <Box sx={{ pt: 3, display: 'inline-block', alignItems: 'center', flexDirection: 'row' }}>
                  {logo && <Avatar alt='Avatar' src={logo} sx={{ width: 40, height: 40, mr: 2 }} />}
                </Box>
                <Avatar alt='Avatar' src={logo} sx={{ width: 40, height: 40, mr: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Leona Watkins (Client)
                  </Typography>
                  <Typography variant='body2'>CEO of Watkins Group</Typography>
                </Box>
              </Box>
            </CardContent>
            <Divider />
            <Grid container>
              <Grid item xs={12} sm={7} md={7} sx={{ p: 2, mb: 5 }}>
                <Form
                  fluid
                  ref={formRef}
                  onChange={setFormValue}
                  onCheck={setFormError}
                  formValue={formValue}
                  model={model}
                >
                  <Grid container spacing={2} mt={1}>
                    {start_at && (
                      <Grid item sm={4} xs={12}>
                        <small>Subscription start</small>
                        <Form.Control
                          size='lg'
                          oneTap
                          accepter={DatePicker}
                          name='start_at'
                          onChange={e => {
                            setStart_at(e.toISOString().substring(0, 10))
                          }}
                          value={new Date(start_at)}
                          block
                        />
                      </Grid>
                    )}

                    {end_at && (
                      <Grid item sm={4} xs={12}>
                        <small>Subscription End</small>
                        <Form.Control
                          size='lg'
                          oneTap
                          name='end_at'
                          accepter={DatePicker}
                          onChange={e => {
                            setEnd_at(e.toISOString().substring(0, 10))
                          }}
                          value={new Date(end_at)}
                          block
                        />
                      </Grid>
                    )}
                    <Grid item sm={4} xs={12}>
                      <Form.Group controlId='input-group'>
                        <small>Available users</small>
                        <InputGroup size='lg'>
                          <Form.Control
                            name='usersCount'
                            onChange={e => {
                              setUsersCount(e)
                            }}
                            min='1'
                            max='100'
                            type='number'
                            size='lg'
                          />
                        </InputGroup>
                      </Form.Group>
                    </Grid>
                  </Grid>
                  <Grid container spacing={3} mt={1}>
                    <Grid item sm={12} xs={12}>
                      <Form.Group>
                        <small>Remarks</small>
                        <Form.Control rows={2} name='address' />
                      </Form.Group>
                    </Grid>
                  </Grid>

                  <Box sx={{ mb: 2, alignItems: 'center' }}>{loading && <LinearProgress />}</Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                    {!loading && (
                      <>
                        <Button color='success' onClick={handleSubmit} variant='contained' sx={{ mr: 3 }}>
                          Save
                        </Button>
                        <Button
                          type='button'
                          color='warning'
                          variant='contained'
                          sx={{ mr: 3 }}
                          onClick={() => close()}
                        >
                          Close
                        </Button>
                      </>
                    )}
                  </Box>
                </Form>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default DialogAddUser
