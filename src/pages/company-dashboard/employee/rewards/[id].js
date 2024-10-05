// ** React Imports
import { useState, useRef, useEffect, forwardRef, useCallback } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'

import { Breadcrumbs, Divider, Typography } from '@mui/material'

import toast from 'react-hot-toast'

// ** Rsuite Imports
import { Form, Schema, SelectPicker, DatePicker, Input } from 'rsuite'
import 'rsuite/dist/rsuite.min.css'

// ** Axios Imports
import axios from 'axios'

import { EmployeeDeductionsType } from 'src/local-db'

// ** Store Imports
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Loading from 'src/views/loading'
import NoPermission from 'src/views/noPermission'
import Link from 'next/link'

const { StringType, NumberType, DateType } = Schema.Types

const Textarea = forwardRef((props, ref) => <Input {...props} as='textarea' ref={ref} />)

const AddDepartment = ({ popperPlacement, id }) => {
  // ** States
  const [loadingDescription, setLoadingDescription] = useState('')
  const [action, setAction] = useState('edit')
  const [loading, setLoading] = useState(false)
  const [employeesDataSource, setEmployeesDataSource] = useState([])
  const router = useRouter()
  const { data: session, status } = useSession
  const formRef = useRef()
  const [formError, setFormError] = useState()

  // --------------forms values--------------------------------

  const default_value = {
    type: '',
    employee_id: '',
    date: null,
    resolution_number: 0,
    description: '',
    value: 0,
    reason: ''
  }
  const [formValue, setFormValue] = useState(default_value)


  // ------------------------------ validate Mmodel ------------------------------------

  const validateMmodel = Schema.Model({
    type: StringType().isRequired('This field is required.'),
    reason: StringType().isRequired('This field is required.'),
    employee_id: StringType().isRequired('This field is required.'),
    value: StringType().isRequired('This field is required.'),
    date: DateType().isRequired('This field is required.')
  })

  // ------------------------------- Get Employees --------------------------------------

  const getEmployees = () => {
    axios.get('/api/company-employee', {}).then(res => {
      let arr = []
      res.data.data.map(employee => {
        arr.push({
          label: employee.firstName + ' ' + employee.lastName +  '  :  ' + employee.idNo,
          value: employee._id
        })
      })
      setEmployeesDataSource(arr)
    }).catch((err)=>{})
    setLoading(false)
  }  ;

  const getreward =  () => {
    setLoading(true)
    axios
      .get('/api/employee-reward/' + id, {})
      .then(function (response) {
        setLoading(false)
        let val = response.data.data[0]

        val.date = new Date(val.date)
        setFormValue({ ...val })
      })
      .catch(function (error) {
        setLoading(false)
      })
  } ;

  useEffect(() => {
    getEmployees(), getreward()
  }, [  ])


  // ------------------------------- Submit --------------------------------------

  const handleSubmit = () => {
    formRef.current.checkAsync().then(result => {
      if (!result.hasError) {
        let data = { ...formValue , value : Number(formValue.value.replaceAll(',',''))}
        if( isNaN(data.value) ) {
          toast.error('Value must be a number' , {duration:5000 , position:'bottom-right'});

          return ;
        } 

        setLoading(true)
        setLoadingDescription('reward is inserting')

        axios
          .post('/api/employee-reward/edit-reward', {
            data
          })
          .then(function (response) {
            router.push('/company-dashboard/employee/rewards')
            toast.success('Reward (' + data.title + ') Edited Successfully.', {
              delay: 3000,
              position: 'bottom-right'
            })
            setLoading(false)
          })
          .catch(function (error) {
            toast.error('Error : ' + error.response.data.message + ' !', {
              delay: 3000,
              position: 'bottom-right'
            })
            setLoading(false)
          })
      }
    })
  }

  // -------------------------------- Routes -----------------------------------------------

  const close = () => {
    router.push('/company-dashboard/employee/rewards/')
  }

  // ------------------------------ View ---------------------------------

  if (loading) return <Loading header='Please Wait' description={loadingDescription}></Loading>

  if (session && session.user && !session.user.permissions.includes('EditEmployeeReward'))
    return <NoPermission header='No Permission' description='No permission to edit employee reward'></NoPermission>

  return (
    <>
      <Grid item xs={12} sm={6} lg={6}></Grid>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
          <Breadcrumbs aria-label='breadcrumb' sx={{ pb: 0, p: 3 }}>
            <Link underline='hover' color='inherit' href='/'>
              Home
            </Link>
            <Link underline='hover' color='inherit' href='/company-dashboard/employee/reward/'>
            Rewards
            </Link>
            <Typography color='text.primary' sx={{ fontSize: 18, fontWeight: '500' }}>
              Edit Rewards
            </Typography>
          </Breadcrumbs>
            <Divider />
            <Grid container>
              <Grid item xs={12} sm={8} md={8} sx={{ p: 2, px: 5, mb: 5 }}>
                <Form
                  fluid
                  ref={formRef}
                  onChange={setFormValue}
                  onCheck={setFormError}
                  formValue={formValue}
                  model={validateMmodel}
                >
                  <Grid container spacing={1} sx={{ px: 5 }}>
                    <Grid item sm={12} md={4}>
                      <small>Type</small>
                      <Form.Control
                        size='sm'
                        controlId='type'
                        name='type'
                        accepter={SelectPicker}
                        data={EmployeeDeductionsType}
                        block
                        value={formValue.type}
                      />
                    </Grid>
                    <Grid item sm={12} md={8}>
                      <small>Employee</small>
                      <Form.Control
                        size='sm'
                        controlId='employee_id'
                        name='employee_id'
                        accepter={SelectPicker}
                        data={employeesDataSource}
                        block
                        value={formValue.employee_id}
                      />
                    </Grid>
                    <Grid item size='sm' sm={12} md={12} sx={{ mt: 6, mb: 8 }}>
                      <Grid item sm={12} md={10}>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                            Date :
                          </Typography>
                          <Form.Control block controlId='date' name='date' accepter={DatePicker} value={formValue.date} />
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                            Value (AED) :
                          </Typography>
                          <Form.Control
                            controlId='value'
                            
                            size='sm'
                            name='value'
                            placeholder='Percentage value'
                            value={formValue.value}
                            type='text'
                            onChange={(e) => {
                              e = String(e).replaceAll(',', '');
                              e = Number(e);
                              setFormValue({ ...formValue, value: Number(e).toLocaleString() })
                            }}
                          />
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                            Reason :
                          </Typography>
                          <Form.Control
                            size='sm'
                            name='reason'
                            placeholder='Reason '
                            controlId='reason'
                            value={formValue.reason}
                          />
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                            Description :
                          </Typography>

                          <Form.Control
                            controlId='description'
                            type='text'
                            size='sm'
                            name='description'
                            placeholder='Description '
                            rows={3}
                            accepter={Textarea}
                            value={formValue.description}
                          />
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                            Resolution number :
                          </Typography>
                          <Form.Control
                            controlId='resolution_number'
                            type='number'
                            size='sm'
                            name='resolution_number'
                            placeholder='resolution Number'
                            value={formValue.resolution_number}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40, mt: 5 }}>
                      {!loading && (
                        <>
                          {action == 'add' && (
                            <Button color='success' onClick={handleSubmit} variant='contained' sx={{ mr: 3 }}>
                              Save
                            </Button>
                          )}
                          {action == 'edit' && (
                            <Button color='success' onClick={handleSubmit} variant='contained' sx={{ mr: 3 }}>
                              Update
                            </Button>
                          )}
                          <Button type='button' color='warning' variant='contained' sx={{ mr: 3 }} onClick={close}>
                            Close
                          </Button>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Form>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

AddDepartment.getInitialProps = async ({ query: { id } }) => {
  return { id: id }
}

export default AddDepartment
