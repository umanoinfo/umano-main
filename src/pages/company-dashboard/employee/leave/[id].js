
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'

// ** React Imports
import { useState, useRef, useEffect, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'

import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'

import { DatePicker } from '@mui/x-date-pickers';
import { TimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import en from 'date-fns/locale/en-GB' // for 24 hourrs format 

import { Breadcrumbs, Divider, Tab, Typography } from '@mui/material'

import toast from 'react-hot-toast'

// ** Rsuite Imports
import { Form, Schema, SelectPicker , Input } from 'rsuite'
import 'rsuite/dist/rsuite.min.css'

// ** Axios Imports
import axios from 'axios'

// ** Store Imports
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Loading from 'src/views/loading'
import NoPermission from 'src/views/noPermission'
import { DataGrid } from '@mui/x-data-grid'
import Link from 'next/link'

const { StringType, NumberType, DateType } = Schema.Types

const Textarea = forwardRef((props, ref) => <Input {...props} as='textarea' ref={ref} />)

const types = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' }
]

const EditLeave = ({ popperPlacement, id }) => {
  // ** States
  const [loadingDescription, setLoadingDescription] = useState('')
  const [action, setAction] = useState('edit')
  const [loading, setLoading] = useState(false)
  const [employeesDataSource, setEmployeesDataSource] = useState([])
  const router = useRouter()
  const { data: session, status } = useSession
  const formRef = useRef()
  const [formError, setFormError] = useState()
  const [fileLoading , setFileLoading] = useState() ;
  const [tempFile, setTempFile] = useState() ;

  // new states

  const [statusDs, setStatusDs] = useState([
    { label: 'Paid leave', value: 'paidLeave' },
    { label: 'Unpaid Leave', value: 'unpaidLeave' },
    { label: 'Sick Leave', value: 'sickLeave' },
    { label: 'Maternity Leave', value: 'maternityLeave' },
    { label: 'Parental Leave', value: 'parentalLeave' },
    { label: 'Other Leave', value: 'otherLeave' }
  ])

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const [days, setDays] = useState([])
  const [holyDays, setholyDays] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  // --------------forms values--------------------------------

  const default_value = {
    type: 'daily',
    employee_id: '',
    date_from: null,
    date_to: null,
    resolution_number: 0,
    description: '',
    status_reason: 'paidLeave',
    reason: ''
  }
  const [formValue, setFormValue] = useState(default_value)

  useEffect(() => {
    setLoading(true);
    getEmployees().then(()=>{
      getMyCompany().then(()=>{
        setLoading(false);
      })

    })
       // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ------------------------------ validate Mmodel ------------------------------------

  const validateMmodel = Schema.Model({
    type: StringType().isRequired('This field is required.'),
    
    // paidValue: NumberType().isRequired('This field is required.'),
    reason: StringType().isRequired('This field is required.'),
    employee_id: StringType().isRequired('This field is required.'),
    date_from: DateType().isRequired('This field is required.'),
    date_to: DateType().isRequired('This field is required.'),
    employee_id: StringType().isRequired('This field is required.'),
    status_reason: StringType().isRequired('This field is required.')
  })

  // ------------------------------- Get Leave --------------------------------------

    const getLeaves = (employees) => {
      setLoading(true)
      axios
        .get('/api/employee-leave/' + id, {})
        .then(function (response) {
          setLoading(false)
          let val = response.data.data[0]

          val.date_from = new Date(val.date_from)
          val.date_to = new Date(response.data.data[0].date_to)

          let employee = employees.find(emp => emp._id == response.data.data[0].employee_id)
          setSelectedEmployee({ ...employee })

          setFormValue({ ...val , date_to: val.date_to , date_from: val.date_from });
          setTempFile( val?.file );
          val = employee.leaves_info.map(e => {
            e.id = e._id

            return e
          })
          setLeavesDataSource(val)

        })
        .catch(function (error) {
          setLoading(false)
        })
  }

  // ------------------------------- Get Employees --------------------------------------

  const getMyCompany = async () => {
    axios.get('/api/company/my-company', {}).then(res => {
      let val = res.data.data[0]

      if (!val.working_days) {
        val.working_days = []
      }
      if (!val.holidays) {
        val.holidays = []
      } else {
        let temp_holydays = []
        val.holidays = val.holidays.map(h => {
          let v = { ...h, date: new Date(h.date) }
          temp_holydays.push(v.date.toDateString())

          return v
        })
        setholyDays(temp_holydays)
      }
      let temp = []
      val.working_days = val.working_days.map(h => {
        temp.push(weekDays.indexOf(h))

        return h
      })
      setDays(temp)
    }).catch((err)=>{})
  }

  const calcDeffTime = val => {
   
    return val.map(val => {
      if (val.type == 'daily') {
        const diffTime = Math.abs(new Date(val.date_to) - new Date(val.date_from) )
        const diffDays = (diffTime / (1000 * 60 * 60 * 24))+1
        let curDate = new Date( val.date_from ) ;
        let totalDays =0  ;
        for(let i =0  ;i < diffDays ;i++){
          if(curDate.getFullYear() == new Date().getFullYear())
            totalDays++;
          curDate = new Date(curDate.getTime() + 1000 * 60 * 60 * 24  ) ; 
        }
        
        return { ...val, leave_value: totalDays }
      } else {
        const diffTime = Math.abs(new Date(val.date_to) - new Date(val.date_from))
        let shift_times = selectedEmployee?.shift_info?.[0]?.times?.[0];
        let shift_hours = (new Date(shift_times?.timeOut) - new Date(shift_times?.timeIn) )/ (1000 * 60 * 60) ;
        const diffDays = (diffTime / (shift_hours)) +1 

        // divide by the shift hours that this employee work not by (8 / 24 ) 

        
        if(new Date(val.date_from).getFullYear() == new Date().getFullYear()){
          return { ...val, leave_value: diffDays };
        }
        else{
          return {...val , leave_value: 0 } ;
        }
      }
    })
  }
  function calculateIntersectionValue(timeRanges1, timeRanges2) {

    let totalIntersection = 0

    for (let i = 0; i < timeRanges1.length; i++) {
      const range1 = timeRanges1[i]
      const start1 = convertToMinutes(range1.start)
      const end1 = convertToMinutes(range1.end)

      for (let j = 0; j < timeRanges2.length; j++) {
        const range2 = timeRanges2[j]
        const start2 = convertToMinutes(range2.start)
        const end2 = convertToMinutes(range2.end)

        const start = Math.max(start1, start2)
        const end = Math.min(end1, end2)

        const intersection = Math.max(0, end - start)
        totalIntersection += intersection
      }
    }

    return totalIntersection
  }

  function convertToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':')

    return parseInt(hours) * 60 + parseInt(minutes)
  }

  const statusName = {
    paidLeave: 'Paid leave' ,
    unpaidLeave: 'Unpaid Leave',
    sickLeave: 'Sick Leave',
    maternityLeave: 'Maternity Leave',
    parentalLeave: 'Parental Leave',
    otherLeave: 'Other Leave' 
  }
  
  

  const calcLeaves = employee => {
    employee = {
      ...employee,
      takenPaidLeaves: 0,
      takenUnpaidLeaves: 0,
      takenSickLeaves: 0,
      takenMaternityLeaves: 0,
      takenParentalLeaves: 0,
      takenOthers: 0
    }
    const leaves = employee.leaves_info.filter((leave)=> {return leave._id != id })
    
    const range1 = employee.shift_info[0].times.map(time => {
      return { start: time.timeIn, end: time.timeOut }
    })


    const rangePaidLeave = []
    const rangeUnpaidLeave = []
    const rangeSick = []
    const rangeMaternityLeave = []
    const rangeParentalLeave = []
    const rangeOthers = []

    // Paid Leave

    const paidLeave = calcDeffTime(
      leaves.filter(val => {
        return val.status_reason == 'paidLeave'
      })
    ).map(val => {
      if (val.type == 'daily') {
        employee.takenPaidLeaves += val.leave_value

        return val
      } else {
        rangePaidLeave.push({ start: val.date_from.substring(11, 16), end: val.date_to.substring(11, 16) })

        return val
      }
    })

    let totalMinutes = range1.reduce((acc, cu) => {
      return acc + (convertToMinutes(cu.end) - convertToMinutes(cu.start))
    }, 0)

    employee.takenPaidLeaves += +(
      1 -
      (totalMinutes - calculateIntersectionValue(range1, rangePaidLeave)) / totalMinutes
    ).toFixed(2)

    // Unpaid Leave

    const unpaidLeave = calcDeffTime(
      leaves.filter(val => {
        return val.status_reason == 'unpaidLeave'
      })
    ).map(val => {
      if (val.type == 'daily') {
        employee.takenUnpaidLeaves += val.leave_value

        return val
      } else {
        rangeUnpaidLeave.push({ start: val.date_from.substring(11, 16), end: val.date_to.substring(11, 16) })

        return val
      }
    })
    totalMinutes = range1.reduce((acc, cu) => {
      return acc + (convertToMinutes(cu.end) - convertToMinutes(cu.start))
    }, 0)
    employee.takenUnpaidLeaves += +(
      1 -
      (totalMinutes - calculateIntersectionValue(range1, rangeUnpaidLeave)) / totalMinutes
    ).toFixed(2)

    // Sick Leave

    const sickLeave = calcDeffTime(
      leaves.filter(val => {
        return val.status_reason == 'sickLeave'
      })
    ).map(val => {
      if (val.type == 'daily') {
        employee.takenSickLeaves += val.leave_value

        return val
      } else {
        rangeSick.push({ start: val.date_from.substring(11, 16), end: val.date_to.substring(11, 16) })

        return val
      }
    })
    totalMinutes = range1.reduce((acc, cu) => {
      return acc + (convertToMinutes(cu.end) - convertToMinutes(cu.start))
    }, 0)
    employee.takenSickLeaves += +(
      1 -
      (totalMinutes - calculateIntersectionValue(range1, rangeSick)) / totalMinutes
    ).toFixed(2)

    // Maternity Leave

    const maternityLeave = calcDeffTime(
      leaves.filter(val => {
        return val.status_reason == 'maternityLeave'
      })
    ).map(val => {
      if (val.type == 'daily') {
        employee.takenMaternityLeaves += val.leave_value

        return val
      } else {
        rangeMaternityLeave.push({ start: val.date_from.substring(11, 16), end: val.date_to.substring(11, 16) })

        return val
      }
    })
    totalMinutes = range1.reduce((acc, cu) => {
      return acc + (convertToMinutes(cu.end) - convertToMinutes(cu.start))
    }, 0)
    employee.takenMaternityLeaves += +(
      1 -
      (totalMinutes - calculateIntersectionValue(range1, rangeMaternityLeave)) / totalMinutes
    ).toFixed(2)

    // Parental Leave

    const parentalLeave = calcDeffTime(
      leaves.filter(val => {
        return val.status_reason == 'parentalLeave'
      })
    ).map(val => {
      if (val.type == 'daily') {
        employee.takenParentalLeaves += val.leave_value

        return val
      } else {
        rangeParentalLeave.push({ start: val.date_from.substring(11, 16), end: val.date_to.substring(11, 16) })

        return val
      }
    })
    totalMinutes = range1.reduce((acc, cu) => {
      return acc + (convertToMinutes(cu.end) - convertToMinutes(cu.start))
    }, 0)
    employee.takenParentalLeaves += +(
      1 -
      (totalMinutes - calculateIntersectionValue(range1, rangeParentalLeave)) / totalMinutes
    ).toFixed(2)

    return employee

   
  }

  const getEmployees = async () => {
    axios.get('/api/company-employee', {}).then(res => {
      let arr = []
      let employees = res.data.data
      employees = employees.map((employee , index) => {
   
        if (employee?.shift_info[0]) {
          arr.push({
            label: employee.firstName + ' ' + employee.lastName + '  :  ' + employee.idNo ,
            value: employee._id
          })
          
          return calcLeaves(employee)
        }
      })
      setEmployeesDataSource(arr)
      setEmployeesFullInfo(employees)

      return employees
    }).then(function(employees) { if(employees){console.log(employees) ; getLeaves(employees)}}).catch((err)=>{})
    setLoading(false)
  }

  // ------------------------------- Submit --------------------------------------
  const checkIntersectionWithVacation = ()=>{
    
    let start = new Date(formValue.date_from) ;
    while(start < new Date(formValue.date_to)){
      let i = !days.includes(start.getDay())
      let j = holyDays.includes(start.toDateString())
      let z = false;
      selectedEmployee?.leaves_info?.map((leave)=>{
        if(leave._id == id ){
          return false ;
        }
        let start_leave = new Date(leave.date_from) ;
        while(start_leave < new Date(leave.date_to)){
          if(start_leave.toDateString() == start.toDateString()){
            z = true ;
            break;
          }
          start_leave = new Date(start_leave.getTime() + 1000 * 60 * 60 * 24 ) ;
        }
      })
      if(i || j || z ){
        return true ;
      }
      start = new Date(start.getTime() + 1000 * 60 * 60 * 24);
    }
    
    return false; 
  }


  const handleSubmit = () => {
    formRef.current.checkAsync().then(result => {
      if (!result.hasError) {
        // if(checkIntersectionWithVacation()){
        //   toast.error('leave intersect with (holiday/weekend/ already taken leave)' , {
        //     duration: 5000,
        //     position:'bottom-right'
        //   } );

        //   return ;
        // }
        let data = { ...formValue }
        const data_request = { ...formValue }

        const range1 = selectedEmployee.shift_info[0].times.map(time => {
          return { start: time.timeIn, end: time.timeOut }
        })

        const totalMinutes = range1.reduce((acc, cu) => {
          return acc + (convertToMinutes(cu.end) - convertToMinutes(cu.start))
        }, 0)

        const newRange = [
          {
            start: data.date_from.toString().substring(16, 21),
            end: data.date_to.toString().substring(16, 21)
          }
        ]

        const diffTime = Math.abs(data.date_to - data.date_from)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

        const newHours = +(1 - (totalMinutes - calculateIntersectionValue(range1, newRange)) / totalMinutes).toFixed(2)

        if (data.type == 'hourly') {
          if (data.status_reason == 'paidLeave') {
            if (+selectedEmployee.availablePaidLeave < newHours + +selectedEmployee.takenPaidLeaves) {
              toast.error('Error : Your paid leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
          if (data.status_reason == 'unpaidLeave') {
            if (+selectedEmployee.availableUnpaidLeave < newHours + +selectedEmployee.takenUnpaidLeaves) {
              toast.error('Error : Your not un paid leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
          if (data.status_reason == 'sickLeave') {
            if (+selectedEmployee.availableSickLeave < newHours + +selectedEmployee.takenSickLeaves) {
              toast.error('Error : Your Sick leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
          if (data.status_reason == 'maternityLeave') {
            if (+selectedEmployee.availableMaternityLeave < newHours + +selectedEmployee.takenMaternityLeaves) {
              toast.error('Error : Your maternity leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
          if (data.status_reason == 'parentalLeave') {
            if (+selectedEmployee.availableParentalLeave < newHours + +selectedEmployee.takenParentalLeaves) {
              toast.error('Error : Your parental leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
        } 
        else {
          if (data.status_reason == 'paidLeave') {
            if (+selectedEmployee.availablePaidLeave < diffDays + +selectedEmployee.takenPaidLeaves) {
              toast.error('Error : Your paid leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
          if (data.status_reason == 'unpaidLeave') {
            if (+selectedEmployee.availableUnpaidLeave < diffDays + +selectedEmployee.takenUnpaidLeaves) {
              toast.error('Error : Your not unpaid leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
          if (data.status_reason == 'sickLeave') {
            if (+selectedEmployee.availableSickLeave < diffDays + +selectedEmployee.takenSickLeaves) {
              toast.error('Error : Your sick leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
          if (data.status_reason == 'maternityLeave') {
            if (+selectedEmployee.availableMaternityLeave < diffDays + +selectedEmployee.takenMaternityLeaves) {
              toast.error('Error : Your maternity leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
          if (data.status_reason == 'parentalLeave') {
            if (+selectedEmployee.availableParentalLeave < diffDays + +selectedEmployee.takenParentalLeaves) {
              toast.error('Error : Your parental leaves are over the limit  !', {
                delay: 3000,
                position: 'bottom-right'
              })

              return
            }
          }
        }

        setLoading(true)
        setLoadingDescription('leaves is inserting')

        let newData = { ...data_request , file: tempFile}

        newData.date_from = new Date(data_request.date_from)
        newData.date_to = new Date(data_request.date_to)
        newData.date_from = new Date(newData.date_from.getTime() + Math.abs(newData.date_from.getTimezoneOffset() * 60000) )
        newData.date_to = new Date(newData.date_to.getTime() + Math.abs(newData.date_to.getTimezoneOffset() * 60000) )
        
        axios
          .post('/api/employee-leave/edit-leave', {
            data: newData
          })
          .then(function (response) {
            router.push('/company-dashboard/employee/leave')
            toast.success('leave (' + data.title + ') Inserted Successfully.', {
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
    router.push('/company-dashboard/employee/leave/')
  }

  function isTimeInRanges(time, ranges) {
    const timeInMinutes = convertToMinutes(time)

    for (let i = 0; i < ranges.length; i++) {
      const { start, end } = ranges[i]
      const startTime = convertToMinutes(start)
      const endTime = convertToMinutes(end)

      if (timeInMinutes >= startTime && timeInMinutes <= endTime) {
        return true
      }
    }

    return false
  }

  const disableDates = val => {
    const range1 = selectedEmployee.shift_info[0].times.map(time => {
      return { start: time.timeIn, end: time.timeOut }
    })

    return isTimeInRanges(val.toString().substring(16, 21), range1)
  }

  //---------------------table -------------------------------------

  const columns = [
    {
      flex: 0.04,
      minWidth: 50,
      field: 'index',
      headerName: 'Doc No',
      renderCell: ({ row }) => {
        return (
          <>
            {row.resolution_number}
          </>
        )
      }
    },
    {
      flex: 0.08,
      field: 'type',
      minWidth: 100,
      headerName: 'Types',
      renderCell: ({ row }) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: 250 }}>
            <Icon fontSize={20} />
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <CustomChip
                color='primary'
                skin='light'
                size='small'
                sx={{ mx: 0.5, mt: 0.5, mb: 0.5 , textTransform: 'capitalize'}}
                label={row.type}
              />
            </div>
          </Box>
        )
      }
    },
    {
      flex: 0.08,
      field: 'status_reason',
      minWidth: 100,
      headerName: 'Status',
      renderCell: ({ row }) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: 250 }}>
            <Icon fontSize={20} />
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <CustomChip
                color='info'
                skin='light'
                size='small'
                sx={{ mx: 0.5, mt: 0.5, mb: 0.5 , textTransform: 'capitalize' }}
                label={statusName[row.status_reason]}
              />
            </div>
          </Box>
        )
      }
    },
    {
      flex: 0.08,
      field: 'reason',
      minWidth: 100,
      headerName: 'Reason',
      renderCell: ({ row }) => {
        return <>{row.reason}</>
      }
    },
    {
      flex: 0.11,
      minWidth: 120,
      field: 'date_from',
      headerName: 'From',
      renderCell: ({ row }) => {
        const [date, time, ...r] = row.date_from.split('T')

        return (
          <>
            {date}  { row.type == 'hourly' && <span style={{'paddingRight' : '5px' , 'paddingLeft' : '5px'}}>{ time.substring(0, 5)}</span>}
          </>
        )
      }
    },
    {
      flex: 0.11,
      minWidth: 120,
      field: 'date_to',
      headerName: 'Date To',
      renderCell: ({ row }) => {
        const [date, time, ...r] = row.date_to.split('T')

        return (
          <>
            {date}  { row.type == 'hourly' && <span style={{'paddingRight' : '5px' , 'paddingLeft' : '5px'}}>{ time.substring(0, 5)}</span>}
          </>
        )
      }
    },

    {
      flex: 0.11,
      minWidth: 120,
      field: 'end',
      headerName: 'Created at',
      renderCell: ({ row }) => {
        return <>{new Date(row.created_at).toISOString().substring(0, 10)}</>
      }
    }
  ]

  const [pageSize, setPageSize] = useState(10)
  let [employeesFullInfo, setEmployeesFullInfo] = useState([])
  const [leavesDataSource, setLeavesDataSource] = useState([])


  const fillTable = id => {

    employeesFullInfo = employeesFullInfo.filter(employee=> employee != undefined );

    let val = employeesFullInfo.find(val => val._id == id)

    setSelectedEmployee({ ...val })
    val = val.leaves_info.map(e => {
      e.id = e._id
      
      return e
    })
    console.log(val)
    setLeavesDataSource(val)
  }

  //-------------------------components-----------------------------

  const changeEmployee = e => {
    fillTable(e)

    const employee = employeesFullInfo.find(val => {
      return val._id == e
    })

    let temp_reasons = []

    if (employee.takenPaidLeaves < +employee.availablePaidLeave) {
      temp_reasons.push({ label: 'Paid leave ', value: 'paidLeave' })
    }
    if (employee.takenUnpaidLeaves < +employee.availableUnpaidLeave) {
      temp_reasons.push({ label: 'Unpaid Leave', value: 'unpaidLeave' })
    }
    if (employee.takenSickLeaves < +employee.availableSickLeave) {
      temp_reasons.push({ label: 'Sick Leave', value: 'sickLeave' })
    }
    if ((employee.takenMaternityLeaves < +employee.availableMaternityLeave) && employee.gender == 'female') {
      temp_reasons.push({ label: 'Maternity Leave', value: 'maternityLeave' })
    }
    if ((employee.takenParentalLeaves < +employee.availableParentalLeave)&& employee.gender == 'male') {
      temp_reasons.push({ label: 'Parental Leave', value: 'parentalLeave' })
    }
    temp_reasons.push({ label: 'Other Leave', value: 'otherLeave' })
    setStatusDs(temp_reasons)

    setFormValue({
      ...formValue,
      employee_id: e,
      date_from: null,
      date_to: null,
      resolution_number: 0,
      description: '',
      status_reason: 'paidLeave',
      paidValue:employee.salaryFormulas_info[0].paidLeave ,
      reason: ''
    })
  }

  const uploadNewFile = async event => {
    setFileLoading(true)
    const file = event.target.files[0]
    let formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'leave')
    let data = {}
    data.formData = formData
    axios
      .post('https://umanu.blink-techno.com/public/api/upload', formData)
      .then(response => {
        setTempFile(response.data)
        setFormValue({...formValue , file: response.data})
        setFileLoading(false);
      })
      .catch(function (error) {
        toast.error('Error : ' + error.response + ' !', {
          delay: 3000,
          position: 'bottom-right'
        })

        setFileLoading(false);
        
      })
  }

  const changeStatus = e =>{
    let paidValue = selectedEmployee.salaryFormulas_info?.[0]?.[e]
    if(e == 'otherLeave'){
      paidValue = 0
    }
    formValue.status_reason = e
    setFormValue({
      ...formValue,
      paidValue:paidValue
    })
  }

  const openFile = fileName => {
    window.open('https://umanu.blink-techno.com/' + fileName, '_blank')
  }

  const RenderDate = () => {
    if (formValue.type == 'daily') {
      return (
        <>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
              From Date :
            </Typography>
            <div>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={en} >
              <Form.Control
                shouldDisableDate={val => {
                  let i = !days.includes(val.getDay())
                  let j = holyDays.includes(val.toDateString())

                  return i || j
                }}
                controlid='date_from'
                format='yyyy-MM-dd '
                name='date_from'
                accepter={DatePicker}
                value={formValue.date_from}
                slotProps={{ textField: { size: 'small' } }}
              />
              </LocalizationProvider>
            </div>
          </Box>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'end' }}>
            <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
              To Date :
            </Typography>
            <div>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={en} >
              <Form.Control
                shouldDisableDate={val => {
                  let i = !days.includes(val.getDay())

                  let j = holyDays.includes(val.toDateString())

                  return i || j
                }}
                controlid='date_to'
                format=' yyyy-MM-dd'
                name='date_to'
                accepter={DatePicker}
                value={formValue.date_to}
                slotProps={{ textField: { size: 'small' } }}
              />
               </LocalizationProvider>
            </div>
            {/* <Form.Control
              controlid='date_to'
              format=' HH:mm'
              name='date_to'
              accepter={DatePicker}
              value={formValue.date_to}
            /> */}
          </Box>
        </>
      )
    } else {
      return (
        <>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
              From Date :
            </Typography>
            <div style={{ display: 'flex' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={en} >
                <Form.Control
                  shouldDisableDate={val => {
                    let i = !days.includes(val.getDay())
                    let j = holyDays.includes(val.toDateString())

                    return i || j
                  }}
                  controlid='date_from'
                  format='yyyy-MM-dd '
                  name='date_from'
                  size='small'
                  accepter={DatePicker}
                  value={formValue.date_from}
                  onChange={e => {
                    e.setHours(0, 0, 0, 0)
                    setFormValue({ ...formValue, date_to: e, date_from: e })
                  }}
                  slotProps={{ textField: { size: 'small' } }}
                />
               </LocalizationProvider>
               <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={en} >
                  <Form.Control
                    shouldDisableDate={val => {
                      return !disableDates(val)
                    }}
                    controlid='date_from'
                    format='HH:mm'
                    size='small'
                    name='date_from'
                    accepter={TimePicker}
                    value={formValue.date_from}
                    slotProps={{ textField: { size: 'small' } }}
                  />
               </LocalizationProvider>
            </div>
          </Box>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
              To Date :
            </Typography>
            <div style={{ display: 'flex' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={en} >
                <Form.Control
                  shouldDisableDate={val => {
                    let i = !days.includes(val.getDay())

                    let j = holyDays.includes(val.toDateString())

                    return i || j
                  }}
                  controlid='date_to'
                  format=' yyyy-MM-dd'
                  name='date_to'
                  size='small'
                  accepter={DatePicker}
                  value={formValue.date_to}
                  disabled
                  slotProps={{ textField: { size: 'small' } }}
                />
               </LocalizationProvider>
               <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={en} >
                  <Form.Control
                    shouldDisableDate={val => {
                      return !disableDates(val)
                    }}
                    controlid='date_to'
                    format=' HH:mm'
                    name='date_to'
                    size='small'
                    accepter={TimePicker}
                    value={formValue.date_to}
                    slotProps={{ textField: { size: 'small' } }}
                  />
              </LocalizationProvider>
            </div>
          </Box>
        </>
      )
    }
  }

  const ChartCard = ({ name, count, taken }) => {
    return (
      <Card sx={{ margin: '5px' }}>
        <CardContent>
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography  sx={{ color: 'primary' }}>{name}</Typography>
              <Typography variant='h6'>{count}</Typography>
            </Box>
          </Box>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center' }}>
                <Typography variant='body2'>Taken</Typography>
              </Box>
              <Typography >{((taken / count) * 100).toFixed(1)} %</Typography>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                {taken}
              </Typography>
            </Box>
            <Divider flexItem sx={{ m: 0 }} orientation='vertical'></Divider>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column' }}>
              <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1.5 }} variant='body2'>
                  Left
                </Typography>
              </Box>
              <Typography >{(100 - (taken / count) * 100).toFixed(1)} %</Typography>
              <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                {count - taken}
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            value={((taken / count) * 100).toFixed(2)}
            variant='determinate'
            sx={{
              height: 10,
              '&.MuiLinearProgress-colorPrimary': { backgroundColor: 'success.main' },
              '& .MuiLinearProgress-bar': {
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                backgroundColor: 'primary.main'
              }
            }}
          />
        </CardContent>
      </Card>
    )
  }

  // ------------------------------ View ---------------------------------

  if (loading) return <Loading header='Please Wait' description={loadingDescription}></Loading>

  if (session && session.user && !session.user.permissions.includes('EditEmployeeLeave'))
    return <NoPermission header='No Permission' description='No permission to add employees leaves'></NoPermission>

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <Breadcrumbs aria-label='breadcrumb' sx={{ pb: 0, p: 3 }}>
              <Link underline='hover' color='inherit' href='/'>
                Home
              </Link>
              <Link underline='hover' color='inherit' href='/company-dashboard/employee/leave/'>
                Leaves List
              </Link>
              <Typography color='text.primary' sx={{ fontSize: 18, fontWeight: '500' }}>
                Edit leave
              </Typography>
            </Breadcrumbs>
            <Divider />
            <Grid container>
   
              <Grid item xs={12} sm={12} md={12} sx={{ p: 2, px: 5, mb: 5 }}>
                <Form
                  fluid
                  ref={formRef}
                  onChange={setFormValue}
                  onCheck={setFormError}
                  formValue={formValue}
                  model={validateMmodel}
                >
                  <Grid container spacing={1} sx={{ px: 5 }}>
                    <Grid item sm={4} md={3} lg={3}>
                      <small>Type</small>
                      <Form.Control
                        size='sm'
                        controlid='type'
                        name='type'
                        accepter={SelectPicker}
                        data={types}
                        block
                        value={formValue.type}
                      />
                    </Grid>
                    <Grid item sm={8} md={5} lg={5}>
                      <small>Employee</small>
                      <Form.Control
                        size='sm'
                        controlid='employee_id'
                        name='employee_id'
                        accepter={SelectPicker}
                        data={employeesDataSource}
                        block
                        value={formValue.employee_id}
                        onChange={e => {
                          changeEmployee(e)
                        }}
                      />
                    </Grid>

                    {selectedEmployee && <Grid item sm={12} md={12} sx={{ mt: 6, mb: 8 }}>
                      <Grid item sm={12} md={8}>
                        <RenderDate />
                        {/* </Box> */}
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                            Status :
                          </Typography>
                          <Form.Control
                            size='sm'
                            controlid='status_reason'
                            name='status_reason'
                            accepter={SelectPicker}
                            data={statusDs}
                            block
                            value={formValue.status_reason}
                            onChange={e=>{changeStatus(e)}}
                          />
                        </Box>

                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                          Paid value (%):
                          </Typography>
                          <Form.Control
                            size='sm'
                            type='number'
                            name='paidValue'
                            placeholder='Paid value '
                            controlid='paidValue'
                            disabled = {formValue.status_reason != 'otherLeave'}
                            value={formValue.paidValue}
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
                            controlid='reason'
                            value={formValue.reason}
                          />
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                            Description :
                          </Typography>

                          <Form.Control
                            controlid='description'
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
                            controlid='resolution_number'
                            type='number'
                            size='sm'
                            name='resolution_number'
                            placeholder='resolution Number'
                            value={formValue.resolution_number}
                          />
                        </Box>
                        <Box >
                          <Typography variant='body2' sx={{ mr: 1, width: '100%' }}>
                            File:
                          </Typography>
                          <div>
                            {
                              formValue.file && 
                              <a  onClick={()=>openFile(formValue.file)}>
                                {formValue.file }
                              </a>
                            }
                          </div>
                          <input
                            controlid='file'
                            type='file'
                            onChange={uploadNewFile}
                            size='sm'
                            name='file'
                            placeholder='file'
                          />
                          {fileLoading && <small style={{ paddingLeft: '20px', fontStyle: 'italic', color: 'blue' }}>Uploading ...</small>}
                          

                        </Box>
                      </Grid>
                    </Grid>}
                    {selectedEmployee &&  <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40, mt: 5 }}>
                      {!loading && (
                        <>
                          <Button color='success' onClick={handleSubmit} variant='contained' sx={{ mr: 3 }}>
                            Update
                          </Button>
                          <Button type='button' color='warning' variant='contained' sx={{ mr: 3 }} onClick={close}>
                            Close
                          </Button>
                        </>
                      )}
                    </Box>}
                  </Grid>
                </Form>
              </Grid>

              {!selectedEmployee ? null : (
                <Grid container >
                  <Grid item xs={12} sm={3} md={3}>
                    <ChartCard
                      count={+selectedEmployee.availablePaidLeave}
                      name={'Paid Leave'}
                      taken={+selectedEmployee.takenPaidLeaves}
                    />
                    </Grid>
                    <Grid item xs={12} sm={3} md={3}>
                    <ChartCard
                      count={+selectedEmployee.availableUnpaidLeave}
                      name={'Unpaid Leave'}
                      taken={+selectedEmployee.takenUnpaidLeaves}
                    />
                    </Grid>
                    <Grid item xs={12} sm={3} md={3}>
                    <ChartCard
                      count={+selectedEmployee.availableSickLeave}
                      name={'Sick Leave'}
                      taken={+selectedEmployee.takenSickLeaves}
                    />
                    </Grid>
                    { selectedEmployee.gender == 'female' &&  <Grid item xs={12} sm={3} md={3}>
                      <ChartCard
                        count={+selectedEmployee.availableMaternityLeave}
                        name={'Maternity Leave'}
                        taken={+selectedEmployee.takenMaternityLeaves}
                      />
                     </Grid>}
                     { selectedEmployee.gender == 'male' && <Grid item xs={12} sm={3} md={3}>
                      <ChartCard
                        count={+selectedEmployee.availableParentalLeave}
                        name={'Parental Leave'}
                        taken={+selectedEmployee.takenParentalLeaves}
                      />
                     </Grid>}
                </Grid>
              )}

            </Grid>

            {formValue.employee_id ? (
              <DataGrid
                autoHeight
                rows={leavesDataSource}
                columns={columns}
                pageSize={pageSize}
                disableSelectionOnClick
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ '& .MuiDataGrid-columnHeaders': { borderRadius: 0 } }}
                onPageSizeChange={newPageSize => setPageSize(newPageSize)}
              />
            ) : null}

          </Card>
        </Grid>
      </Grid>
    </>
  )
}

EditLeave.getInitialProps = async ({ query: { id } }) => {
  return { id: id }
}

export default EditLeave
