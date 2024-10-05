// ** MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useCallback, useRef } from 'react'

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import Loading from 'src/views/loading'

const Slip = ({ id }) => {
  // ** Hooks

  const printRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [payroll, setPayroll] = useState()



  const getPayroll =  () => {
    axios.get('/api/end-of-service/' + id, {}).then(res => {
      setPayroll(res.data.data[0])
      setLoading(false)
    }).catch((err)=>{})
  } ;

  useEffect(() => {
    getPayroll()
  }, [id])

  async function saveCapture() {
    const elemente = printRef.current
    const canvas = await html2canvas(elemente)
    const data = canvas.toDataURL('image/png')

    const pdf = new jsPDF()
    const imgProperties = pdf.getImageProperties(data)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width

    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save('print.pdf')

    return data
  }

  //   --------------------------- View ----------------------------------------------

  if (loading) return <Loading header='Please Wait'></Loading>

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card style={{ padding: '30px' }} ref={printRef}>
          <h2 style={{ margin: '30px', textAlign: 'center' }}>End of service gratuity</h2>
          {/* <Box style={{ border: '1px solid black', margin: '5px', textAlign: 'center' }}> address</Box> */}

          <div item xs={12} style={{ margin: '20px', display: 'flex' }}>
            <div style={{ width: '50%', padding: '5px' }} xs={12} md={6}>
              <div item xs={12}>
                <span style={{ fontWeight: 'bold' }}>Name :</span> {payroll.name}
              </div>
              <div item xs={12}>
                <span style={{ fontWeight: 'bold' }}>Designation :</span>
                {payroll.employeePositions_info.map(val => {
                  return val.positionTitle + ' , '
                })}
              </div>
              <div item xs={12}>
                <span style={{ fontWeight: 'bold' }}>Date :</span>
                {payroll.fromDate.substring(0, 10) + ' to ' + payroll.toDate.substring(0, 10)}
              </div>
              <div item xs={12}>
                <span style={{ fontWeight: 'bold' }}>Joining Date :</span>
                {payroll.joiningDate.substring(0, 10)}
              </div>
            </div>
            <div style={{ width: '50%', padding: '5px' }} xs={12} md={6}>
              <div item xs={12}>
                <span style={{ fontWeight: 'bold' }}>Salary :</span>
                {payroll.lumpySalary} AED
              </div>
              <div item xs={12}>
                <span style={{ fontWeight: 'bold' }}>Email :</span>
                {payroll.email}
              </div>
              <div item xs={12}>
                <span style={{ fontWeight: 'bold' }}>ID Number :</span>
                {payroll.idNo}
              </div>
              <div item xs={12}>
                <span style={{ fontWeight: 'bold' }}>Phone :</span>
                {payroll.mobilePhone}
              </div>
            </div>
          </div>
          <div item xs={12} style={{ margin: '20px', display: 'flex' }}>
            <div style={{ margin: '5px', width: '100%', border: '1px solid black' }} xs={12}>
              <h4 style={{ margin: '5px', textAlign: 'center' }}>Items</h4>

              <div style={{ width: '100%', display: 'flex' }}>
                <div
                  style={{
                    borderRight: '1px solid black',
                    borderTop: '1px solid black',
                    borderBottom: '1px solid black',
                    width: '50%',
                    textAlign: 'center'
                  }}
                >
                  Item
                </div>
                <div
                  style={{
                    borderLeft: '1px solid black',
                    borderTop: '1px solid black',
                    borderBottom: '1px solid black',
                    width: '50%',
                    textAlign: 'center'
                  }}
                >
                  Amount
                </div>
              </div>
              <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
                <div style={{ width: '50%', textAlign: 'center', padding: '5px', borderRight: '1px solid black' }}>
                  Less Than Five Year
                </div>
                <div style={{ width: '50%', textAlign: 'center', padding: '5px', borderLeft: '1px solid black' }}>
                  {Number(Number(payroll.lessThanFiveValue).toFixed(2)).toLocaleString()} AED
                </div>
                {/*  */}
                <div style={{ width: '50%', textAlign: 'center', padding: '5px', borderRight: '1px solid black' }}>
                  More Than Five Year
                </div>
                <div style={{ width: '50%', textAlign: 'center', padding: '5px', borderLeft: '1px solid black' }}>
                  {Number(Number(payroll.moreThanFiveValue).toFixed(2)).toLocaleString()} AED
                </div>
              </div>
            </div>
          </div>
          <div item xs={12} style={{ margin: '20px', display: 'flex' }}>
            <div style={{ width: '50%', padding: '5px' }} xs={12} md={6}>
              <div style={{ width: '100%', display: 'flex' }}>
                <div style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
                  Less Than Five Year
                </div>
                <div style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
                  {payroll.lessThanFiveDays} Days
                </div>
              </div>
            </div>
            <div style={{ width: '50%', padding: '5px' }} xs={12} md={6}>
              <div style={{ width: '100%', display: 'flex' }}>
                <div style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
                  More Than Five Year
                </div>
                <div style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
                  {payroll.moreThanFiveDays} Days
                </div>
              </div>
            </div>
          </div>
          <div item xs={12} style={{ margin: '20px', display: 'flex' }}>
            <div style={{ width: '50%', padding: '5px' }} xs={12} md={6}>
              <div style={{ width: '100%', display: 'flex' }}>
                <div style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
                  Actual Years
                </div>
                <div style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
                  {payroll.actualYears} Years
                </div>
              </div>
            </div>
            <div style={{ width: '50%', padding: '5px' }} xs={12} md={6}>
              <div style={{ width: '100%', display: 'flex' }}>
                <div style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
                  Actual Days
                </div>
                <div style={{ border: '1px solid black', padding: '5px', width: '50%', textAlign: 'center' }}>
                  {payroll.actualDays} Days
                </div>
              </div>
            </div>
          </div>
          <div item xs={12} style={{ margin: '20px', display: 'flex' }}>
            <div style={{ width: '100%', padding: '5px' }} xs={12} md={6}>
              <div style={{ width: '100%', display: 'flex', border: '1px solid black' }}>
                <div style={{ padding: '5px', width: '50%', textAlign: 'center' }}>Total</div>
                <div style={{ padding: '5px', width: '50%', textAlign: 'center' }}>
                  {Number(Number(payroll.endOfServeceTotalValue).toFixed(2)).toLocaleString()} AED
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: '30px' }}>
            <Button sx={{ mr: 4, mb: 2 }} color='primary' onClick={saveCapture} variant='outlined'>
              print
            </Button>
            <Button sx={{ mr: 4, mb: 2 }} color='warning' variant='outlined'>
              send to email
            </Button>
          </div>
        </Card>
      </Grid>
    </Grid>
  )
}

Slip.getInitialProps = async ({ query: { id } }) => {
  return { id: id }
}

export default Slip
