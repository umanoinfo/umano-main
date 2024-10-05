// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const fetchData = createAsyncThunk('appEmployeeDeduction/fetchData', async params => {
  const response = await axios.get('/api/employee-deduction/', {
    params
  })
  response.data.data.map((e, index) => {
    e.id = e._id
    e.index = index + 1
    e.employeeName = e.employee_info[0].firstName + ' ' + e.employee_info[0].middleName + ' ' + e.employee_info[0].lastName ;
  })

  return response.data
})

export const appEmployeeDeductionSlice = createSlice({
  name: 'appEmployee',
  initialState: {
    data: [],
    total: 0,
    params: {}
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchData.fulfilled, (state, action) => {
      state.data = action.payload.data
      state.params = action.payload.params
      state.total = action.payload.data.length
    })
  }
})

export default appEmployeeDeductionSlice.reducer
