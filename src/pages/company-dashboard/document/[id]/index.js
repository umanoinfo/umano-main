// ** React Imports
import { useState, forwardRef, useEffect, useRef, useCallback } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Card from '@mui/material/Card'
import CustomChip from 'src/@core/components/mui/chip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Icon from 'src/@core/components/icon'
import { Accordion, AccordionDetails, AccordionSummary, Breadcrumbs, Divider, InputAdornment, Typography } from '@mui/material'
import List from '@mui/material/List'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'

// ** Rsuite Imports
import { Form, Schema, DatePicker, TagPicker, Uploader, Input, Checkbox, Textarea } from 'rsuite'
import 'rsuite/dist/rsuite.min.css'

// ** Axios Imports
import axios from 'axios'

// ** Actions Imports
import { fetchData } from 'src/store/apps/company'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Loading from 'src/views/loading'
import NoPermission from 'src/views/noPermission'

import { styled } from '@mui/material/styles'
import { grey } from '@mui/material/colors'
import Link from 'next/link'

const { StringType, ArrayType } = Schema.Types

const styles = {
  marginBottom: 10
}

const fileType = ex => {
  switch (ex) {
    case 'jpg':
      return '/images/icons/file-icons/img.png'
      break
    default:
      return '/images/icons/file-icons/rar.png'
  }
}

  const selectData = [
    'Active',
    'Canceled'
  ].map(item => ({
    label: item,
    value: item
  }))

const StyledList = styled(List)(({ theme }) => ({
  '& .MuiListItem-container': {
    border: `1px solid ${theme.palette.divider}`,
    '&:first-of-type': {
      borderTopLeftRadius: theme.shape.borderRadius,
      borderTopRightRadius: theme.shape.borderRadius
    },
    '&:last-child': {
      borderBottomLeftRadius: theme.shape.borderRadius,
      borderBottomRightRadius: theme.shape.borderRadius
    },
    '&:not(:last-child)': {
      borderBottom: 0
    },
    '& .MuiListItem-root': {
      paddingRight: theme.spacing(24)
    },
    '& .MuiListItemText-root': {
      marginTop: 0,
      '& .MuiTypography-root': {
        fontWeight: 500
      }
    }
  }
}))

const AddDepartment = ({ popperPlacement, id }) => {
  // ** States
  const [employeeId, setEmployeeId] = useState('')
  const [plan, setPlan] = useState('')
  const [loadingDescription, setLoadingDescription] = useState('')
  const [value, setValue] = useState('')
  const [form, setForm] = useState(false)
  const [action, setAction] = useState('add')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [selectedDocument, setSelectedDocument] = useState()
  const [selectedFiles, setSelectedFiles] = useState()
  const [selectedLogBook, setSelectedLogBook] = useState()

  const [expiryDateFlag, setExpiryDateFlag] = useState(false)
  const [expiryDate, setExpiryDate] = useState(new Date().toISOString().substring(0, 10))
  const [preparedDate, setPreparedDate] = useState(new Date().toISOString().substring(0, 10))
  const [preparedBy, setPreparedBy] = useState()
  const [approvedDate, setApprovedDate] = useState(new Date().toISOString().substring(0, 10))
  const [approvedBy, setApprovedBy] = useState()
  const router = useRouter()
  const { data: session, status } = useSession
  const formRef = useRef()
  const inputFile = useRef(null)
  const [formError, setFormError] = useState({})
  const [formValue, setFormValue] = useState({})


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

  const getDocument =  () => {
    setLoading(true)
    axios.get('/api/document/' + id, {}).then(response => {
      setSelectedDocument(response.data.data[0])
      setSelectedLogBook(response.data.logBook)

      let files = response.data.data[0].files_info.filter((file)=>{
        if(!file.deleted_at){
          return file
        }
      })
      setSelectedFiles(files)
      setLoading(false)
    }).catch((err)=>{})
  }  ;

  
  useEffect(() => {
    getDocument()
    
  }, [ ])

  // -----------------------------------------------------------

  const open_file = fileName => {
    window.open('https://umanu.blink-techno.com/' + fileName, '_blank')
  }

  // ----------------------------------------------------------

  const goToIndex = () => {
    router.push('/company-dashboard/document')
  }

  // -------------------------------- Routes -----------------------------------------------

  const close = () => {
    router.push('/company-dashboard/department')
  }

  const addToFiles = e => {
    let temp = files
    temp.push(e.blobFile)
    setFiles(temp)
  }

  const changeFileType = (e) => {
    let files = selectedDocument.files_info.filter((file)=>{
      if((!file.deleted_at && e.includes('Active')) ){
        return file
      }
      if((file.deleted_at && e.includes('Canceled')) ){
        return file
      }
    })
    setSelectedFiles(files)
  }

  const removeFile = e => {}

  // const Textarea = forwardRef((props, ref) => <Input as='textarea' />)

  // ------------------------------ View ---------------------------------

  if (loading) return <Loading header='Please Wait' description={loadingDescription}></Loading>

  if (session && session.user && !session.user.permissions.includes('ViewDocument'))
    return <NoPermission header='No Permission' description='No permission to view document'></NoPermission>

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
              <Link underline='hover' color='inherit' href='/company-dashboard/document/'>
                All Documents
              </Link>
              <Typography color='text.primary' sx={{ fontSize: 18, fontWeight: '500' }}>
              View Document
              </Typography>
            </Breadcrumbs>
            <Divider />
            <Grid container>
              <Grid item xs={12} sm={6} md={6} sx={{ p: 2, px: 5, mb: 5 }}>
                {selectedDocument && (
                  <Card>
                    <CardContent sx={{ pt: 8, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography variant='h6' sx={{ mb: 2 }}>
                        {selectedDocument.title}
                      </Typography>
                      {selectedDocument.description}
                      <Box>
                        {selectedDocument.type.map((t, index) => {
                          return (
                            <CustomChip
                            key ={index}
                              skin='light'
                              size='small'
                              label={t}
                              color='info'
                              sx={{
                                height: 20,
                                mt: 3,
                                mr: 1,
                                fontWeight: 600,
                                borderRadius: '5px',
                                fontSize: '0.875rem',
                                textTransform: 'capitalize',
                                '& .MuiChip-label': { mt: -0.25 }
                              }}
                            />
                          )
                        })}
                      </Box>
                    </CardContent>

                    <CardContent>
                      <Divider sx={{ mt: theme => `${theme.spacing(4)} !important` }} />
                        <Box sx={{ pt: 2, pb: 1 }}>
                          {selectedDocument.version && (
                            <Box sx={{ display: 'flex', mb: 2.7 }}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                Version:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                {selectedDocument.version}
                              </Typography>
                            </Box>
                          )}
                          {selectedDocument.expiryDateFlag && (
                            <Box sx={{ display: 'flex', mb: 2.7 }}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                Expiry Date:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                              <span>-</span>
                              </Typography>
                            </Box>
                          )}
                          {!selectedDocument.expiryDateFlag && (
                            <Box sx={{ display: 'flex', mb: 2.7 }}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                Expiry Date:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                              {selectedDocument.expiryDate}
                              </Typography>
                              <CustomChip
                                skin='light'
                                size='small'
                                label={
                                  Math.floor((new Date(selectedDocument.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24), 1) +
                                  ' Day'
                                }
                                color={dayColor(
                                  Math.floor((new Date(selectedDocument.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24), 1)
                                )}
                                sx={{ textTransform: 'capitalize', '& .MuiChip-label': { lineHeight: '18px' }, ml: 3 }}
                              />
                            </Box>
                          )}
                          {selectedDocument.status && (
                            <Box sx={{ display: 'flex', mb: 2.7 }}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                Status:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                {selectedDocument.status}
                              </Typography>
                            </Box>
                          )}
                          {selectedDocument.created_at && (
                            <Box sx={{ display: 'flex', mb: 2.7 }}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                Created at:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                {new Date(selectedDocument.created_at).toISOString().substring(0, 10)}
                              </Typography>
                            </Box>
                          )}
                            <Box sx={{ display: 'flex', mb: 2.7 }}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                              Issue Date:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                {new Date(selectedDocument.issueDate).toISOString().substring(0, 10)}
                              </Typography>
                            </Box>
                            {
                              selectedDocument.category.includes('Vendors') ? 
                              <>
                                <Typography variant='subtitle2' sx={{ mt:5 , mr: 2, color: 'text.primary' }}>
                                <strong pt={5} className='px-5 pt-4'> Company Information </strong >
                                </Typography>
                                <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                    Company Name:
                                  </Typography>
                                  <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                    {selectedDocument.companyName}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                    Company Mobile:
                                  </Typography>
                                  <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                    {selectedDocument.companyMobile}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                    Company Email:
                                  </Typography>
                                  <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                    {selectedDocument.companyEmail}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                    Company Fax:
                                  </Typography>
                                  <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                    {selectedDocument.companyFax}
                                  </Typography>
                                </Box>
                                 <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                    Company Landline:
                                  </Typography>
                                  <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                    {selectedDocument.companyLandline}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                    Company Contact Person:
                                  </Typography>
                                  <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                    {selectedDocument.companyContactPerson}
                                  </Typography>
                                </Box>
                              </>
                              :
                              <>
                              </>
                            }

                            {
                              selectedDocument.category.includes('Third Party Contracts') ? 
                              <>
                                <Typography variant='subtitle2' sx={{ mt:5 , mr: 2, color: 'text.primary' }}>
                                <strong pt={5} className='px-5 pt-4'> Third Party Contracts Information </strong >
                                </Typography>
                                <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                    Third Party Email:
                                  </Typography>
                                  <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                    {selectedDocument.thirdPartyContractorsEmail}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                                  <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                    Third Party Landline:
                                  </Typography>
                                  <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                    {selectedDocument.thirdPartyContractorsLandline}
                                  </Typography>
                                </Box>
                              </>
                              :
                              <>
                              </>
                            }
                            

                            <Typography variant='subtitle2' sx={{ mt:5 , mr: 2, color: 'text.primary' }}>
                                <strong pt={5} className='px-5 pt-4'>Person in charge of renewing licences informations</strong >
                            </Typography>

                            <Box sx={{ display: 'flex', mb: 2.7 , mt:3}}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                Name:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                {selectedDocument.renewing_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', mb: 2.7 , mt:1}}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                Phone:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                {selectedDocument.renewing_phone}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', mb: 2.7 , mt:1}}>
                              <Typography variant='subtitle2' sx={{ mr: 2, color: 'text.primary' }}>
                                Email:
                              </Typography>
                              <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
                                {selectedDocument.renewing_email}
                              </Typography>
                            </Box>
                         
                        </Box>
                        <div>
                          <Accordion>
                            <AccordionSummary
                              id='panel-header-1'
                              aria-controls='panel-content-1'
                              expandIcon={<Icon icon='mdi:chevron-down' />}
                            >
                              <Typography >History</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                            {selectedLogBook && 
                        <TableContainer component={Paper}>
                          <Table sx={{ minWidth: 600 }} size='small' aria-label='a dense table'>
                            <TableHead>
                              <TableRow>
                                <TableCell align='left'>Date</TableCell>
                                <TableCell align='left'>User</TableCell>
                                <TableCell align='left'>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedLogBook.map((row , index) => (
                                <TableRow key={row.index} sx={{ '&:last-of-type  td, &:last-of-type  th': { border: 0 } }}>
                                  <TableCell align='left'>{new Date(row.created_at).toLocaleString()}</TableCell>
                                  <TableCell align='left'>{row.user_info[0].name}</TableCell>
                                  <TableCell align='left'>{row.Description}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>}
                            </AccordionDetails>
                          </Accordion>
                        </div>
                    </CardContent>
                  </Card>
                )}
              </Grid>
              <Grid item xs={12} sm={6} md={6} sx={{ p: 2, px: 5, mb: 5 }}>
                <Card>
                  <Box
                    sx={{
                      pt: 2,
                      px: 2,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold' }}>Files</Typography>
                      <>
                        <TagPicker
                            name='type'
                            controlId='type'
                            accepter={TagPicker}
                            defaultValue={['Active']}
                            data={selectData}
                            style={{ width: '280px' }}
                            onChange={changeFileType}
                            placeholder="Select Status"
                          />
                      </>
                     </Box>

                  <Divider />
                  <Box sx={{ p: 2 }}>
                    {selectedFiles && selectedFiles.length == 0 && <span>No Files To Show.</span>}
                    {selectedFiles &&
                      selectedFiles.length > 0 &&
                      selectedFiles.map((file, index) => {
                        return (
                          <>
                            <Box
                              key={file.name}
                              sx={{
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Card sx={{ p: 2, mr: 2 }}>
                                <Icon
                                  icon='material-symbols:file-present-outline-rounded'
                                  sx={{ color: 'text.primary' }}
                                />
                              </Card>
                              {/* <Avatar src={file.src} variant='rounded' sx={{ mr: 3, width: 38, height: 38 }} /> */}
                              <Box
                                sx={{
                                  width: '100%',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <Box sx={{ mr: 2, display: 'flex', mb: 0.4, flexDirection: 'column' }}>
                                  <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                                    <a href='#' onClick={e => open_file(file.url)}>
                                      {file.name}
                                    </a>
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      '& svg': {
                                        mr: 1.5,
                                        color: 'text.secondary',
                                        verticalAlign: 'middle'
                                      }
                                    }}
                                  >
                                    <Icon icon='mdi:calendar-blank-outline' fontSize='1rem' />
                                    <Typography variant='caption'>
                                      {new Date(file.created_at).toISOString().toString(0, 10)}
                                    </Typography>
                                  </Box>
                                </Box>
                                {file.deleted_at && (
                                  <CustomChip
                                    skin='light'
                                    size='small'
                                    label='Canceled'
                                    color='error'
                                    sx={{ height: 20, fontSize: '0.75rem', fontWeight: 500 }}
                                  />
                                )}
                                {!file.deleted_at && (
                                  <CustomChip
                                    skin='light'
                                    size='small'
                                    label='Active'
                                    color='success'
                                    sx={{ height: 20, fontSize: '0.75rem', fontWeight: 500 }}
                                  />
                                )}
                              </Box>
                            </Box>
                            <Divider sx={{ mt: 0, pt: 0 }} />
                          </>
                        )
                      })}
                  </Box>
                </Card>
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
