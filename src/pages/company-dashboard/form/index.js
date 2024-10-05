// ** React Imports
import { useState, useEffect, useCallback } from 'react'

// ** Next Imports
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Menu from '@mui/material/Menu'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import { DataGrid } from '@mui/x-data-grid'
import { styled } from '@mui/material/styles'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContentText from '@mui/material/DialogContentText'
import toast from 'react-hot-toast'
import Loading from 'src/views/loading'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** Actions Imports
import { fetchData } from 'src/store/apps/form'
import { FormType } from 'src/local-db'

// ** Third Party Components
import axios from 'axios'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import NoPermission from 'src/views/noPermission'
import { right } from '@popperjs/core'
import { Breadcrumbs } from '@mui/material'

// ** Status Obj

const StatusObj = {
  active: 'success',
  pending: 'warning',
  blocked: 'error'
}

// ** Day Color

const dayColor = days => {
  if (days > 30) {
    return 'success'
  }
  if (days < 30 && days > 6) {
    return 'warning'
  }
  if (days <= 5) {
    return 'error'
  }
}

const AllDocumentsList = () => {
  // ** State
  const [formType, setFormType] = useState()
  const [formStatus, setFormStatus] = useState('')
  const [value, setValue] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState()
  const { data: session, status } = useSession()

  // ** Hooks

  const dispatch = useDispatch()
  const store = useSelector(state => state.form)
  const router = useRouter()

  useEffect(() => {
    setLoading(true);
    dispatch(
      fetchData({
        formType,
        formStatus,
        q: value
      })
    ).then( () => setLoading(false))
  }, [dispatch, formType, formStatus, value])

  // ----------------------- Handle ------------------------------

  const handleClose = () => {
    setOpen(false)
  }

  const handleFilter = useCallback(val => {
    setValue(val)
  }, [])

  const handleStatusChange = useCallback(e => {
    setFormStatus(e.target.value)
  }, [])

  const handleTypeChange = useCallback(e => {
    setFormType(e.target.value)
  }, [])

  // -------------------------- Delete Form --------------------------------

  const deleteForm = () => {
    setLoading(true);
    axios
      .post('/api/form/delete-form', {
        selectedForm
      })
      .then(function (response) {
        dispatch(fetchData({})).then(() => {
          toast.success('Form (' + selectedForm.name + ') Deleted Successfully.', {
            delay: 1000,
            position: 'bottom-right'
          })
          setOpen(false)
          setLoading(false);
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

  // -------------------------- Add Document -----------------------------------------------

  const addForm = () => {
    router.push('/company-dashboard/form/add-form')
  }

  // -------------------------- Row Options -----------------------------------------------

  const RowOptions = ({ row }) => {
    // ** State
    const [anchorEl, setAnchorEl] = useState(null)
    const rowOptionsOpen = Boolean(anchorEl)

    const handleRowOptionsClick = event => {
      setAnchorEl(event.currentTarget)
    }

    const handleRowOptionsClose = () => {
      setAnchorEl(null)
    }

    const handleEditRowOptions = () => {
      router.push('/company-dashboard/form/' + row._id + '/edit-form')
      handleRowOptionsClose()
    }

    const handleRowView = () => {
      router.push('/company-dashboard/form/' + row._id)
      handleRowOptionsClose()
    }

    const handleAddRequest = () => {
      router.push('/company-dashboard/form/' + row._id + '/add-form-request')
    }

    const handleDelete = () => {
      setSelectedForm(row)
      setOpen(true)
    }

    // ------------------------------ Table Definition ---------------------------------

    return (
      <>
        <IconButton size='small' onClick={handleRowOptionsClick}>
          <Icon icon='mdi:dots-vertical' />
        </IconButton>
        <Menu
          keepMounted
          anchorEl={anchorEl}
          open={rowOptionsOpen}
          onClose={handleRowOptionsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          PaperProps={{ style: { minWidth: '8rem' } }}
        >
          {/* {session && session.user && session.user.permissions.includes('ViewForm') && (
            <MenuItem onClick={handleRowView} sx={{ '& svg': { mr: 2 } }}>
              <Icon icon='mdi:eye-outline' fontSize={20} />
              View
            </MenuItem>
          )} */}
          {session && session.user && session.user.permissions.includes('AddFormRequest') && (
            <MenuItem onClick={handleAddRequest} sx={{ '& svg': { mr: 2 } }}>
              <Icon icon='ph:file' fontSize={20} />
              Add Request
            </MenuItem>
          )}
          {session && session.user && session.user.permissions.includes('EditForm') && (
            <MenuItem onClick={handleEditRowOptions} sx={{ '& svg': { mr: 2 } }}>
              <Icon icon='mdi:pencil-outline' fontSize={20} />
              Edit
            </MenuItem>
          )}
          {session && session.user && session.user.permissions.includes('DeleteForm') && (
            <MenuItem onClick={handleDelete} sx={{ '& svg': { mr: 2 } }}>
              <Icon icon='mdi:delete-outline' fontSize={20} />
              Delete
            </MenuItem>
          )}
        </Menu>
      </>
    )
  }

  // ------------------------------- Table columns --------------------------------------------

  const columns = [
    {
      flex: 0.02,
      minWidth: 50,
      field: '#',
      headerName: '#',
      renderCell: ({ row }) => {
        return (
          <Typography variant='subtitle1' noWrap sx={{ textTransform: 'capitalize' }}>
            {row.index}
          </Typography>
        )
      }
    },
    {
      flex: 0.17,
      minWidth: 100,
      field: 'title',
      headerName: 'Title',
      renderCell: ({ row }) => {
        return (
          <Typography variant='subtitle1' noWrap sx={{ textTransform: 'capitalize' }}>
            {row.title}
          </Typography>
        )
      }
    },
    {
      flex: 0.07,
      field: 'version',
      minWidth: 100,
      headerName: 'Version',
      renderCell: ({ row }) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Icon fontSize={20} />
            {row.version}
          </Box>
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
                sx={{ mx: 0.5, mt: 0.5, mb: 0.5 }}
                label={row.type}
              />
            </div>
          </Box>
        )
      }
    },
    {
      flex: 0.11,
      minWidth: 120,
      field: 'created_at',
      headerName: 'Created at',
      renderCell: ({ row }) => {
        return <>{new Date(row.created_at).toISOString().substring(0, 10)}</>

        // return <>{new Date(row.created_at)}</>
      }
    },
    {
      flex: 0.07,
      minWidth: 45,
      field: 'status',
      headerName: 'Status',
      renderCell: ({ row }) => {
        return (
          <CustomChip
            skin='light'
            size='small'
            label={row.status}
            color={StatusObj[row.status]}
            sx={{ textTransform: 'capitalize', '& .MuiChip-label': { lineHeight: '18px' } }}
          />
        )
      }
    },
    {
      flex: 0.01,
      minWidth: 45,
      sortable: false,
      field: 'actions',
      headerName: '',
      renderCell: ({ row }) => <RowOptions row={row} />
    }
  ]

  // ------------------------------------ View ---------------------------------------------

  // if (loading) return <Loading header='Please Wait' description='Forms are loading'></Loading>

  if (session && session.user && !session.user.permissions.includes('ViewForm'))
    return <NoPermission header='No Permission' description='No permission to view forms'></NoPermission>

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <Breadcrumbs aria-label='breadcrumb' sx={{ pb: 0, p: 3 }}>
            <Link underline='hover' color='inherit' href='/'>
              Home
            </Link>
            <Typography color='text.primary' sx={{ fontSize: 18, fontWeight: '500' }}>
              Forms List
            </Typography>
          </Breadcrumbs>
          <Divider />
          <Grid container spacing={6} sx={{ px: 5, pt: 3 }}>
            <Grid item sm={2} xs={6}>
              <FormControl fullWidth size='small'>
                <InputLabel id='status-select'>Select Status</InputLabel>
                <Select
                  fullWidth
                  value={formStatus}
                  id='select-status'
                  label='Select Status'
                  labelId='status-select'
                  onChange={handleStatusChange}
                  inputProps={{ placeholder: 'Select Status' }}
                >
                  <MenuItem value=''>All Status</MenuItem>
                  <MenuItem value='active'>Active</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item sm={2} xs={6}>
              <FormControl fullWidth size='small'>
                <InputLabel id='status-select'>Select Type</InputLabel>
                <Select
                  fullWidth
                  value={formType}
                  id='select-type'
                  label='Select Type'
                  labelId='type-select'
                  onChange={handleTypeChange}
                  inputProps={{ placeholder: 'Select Type' }}
                >
                  <MenuItem value=''>All Type</MenuItem>
                  {FormType &&
                    FormType.map((type, index) => {
                      return (
                        <MenuItem key={index} value={type.value}>
                          {type.label}
                        </MenuItem>
                      )
                    })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item sm={3} xs={12}>
              {/* <FormControl fullWidth size='small'>
                <TextField
                  size='small'
                  label='Search'
                  value={value}
                  sx={{ mr: 6, mb: 2 }}
                  placeholder='Search User'
                  onChange={e => handleFilter(e.target.value)}
                />
              </FormControl> */}
            </Grid>

            <Grid item sm={5} xs={12} textAlign={right}>
              {session && session.user && session.user.permissions.includes('AddForm') && (
                <Button type='button' variant='contained' sx={{ mb: 3 }} onClick={() => addForm()}>
                  Add Form
                </Button>
              )}
            </Grid>
          </Grid>

          <Divider />

          {/* -------------------------- Table -------------------------------------- */}
{
          loading ? 
          <Loading header='Please Wait' description='Forms are loading'></Loading>:
          <DataGrid
            autoHeight
            rows={store.data}
            columns={columns}
            pageSize={pageSize}
            disableSelectionOnClick
            rowsPerPageOptions={[10, 25, 50]}
            sx={{ '& .MuiDataGrid-columnHeaders': { borderRadius: 0 } }}
            onPageSizeChange={newPageSize => setPageSize(newPageSize)}
          />
}          
        </Card>
      </Grid>

      {/* -------------------------- Delete Dialog -------------------------------------- */}

      <Dialog
        open={open}
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
            Are you sure , you want to delete Form <span className='bold'>{selectedForm && selectedForm.title}</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button onClick={deleteForm}>Yes</Button>
          <Button onClick={handleClose}>No</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default AllDocumentsList
