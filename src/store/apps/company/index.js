// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

export const fetchData = createAsyncThunk('appCompanies/fetchData', async params => {
  const response = await axios.get('/api/company/', {
    params
  })
  response.data.data.map((e, index) => {
    e.index = index + 1
    e.id = e._id
    if(e?.user_info[0]?.name)
      e.manager = e?.user_info[0]?.name  ;
    else
      e.manager = null;
    
  })
  

  return response.data
})

export const appRolesSlice = createSlice({
  name: 'appRoles',
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

export default appRolesSlice.reducer
