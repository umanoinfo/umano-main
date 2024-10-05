import { connectToDatabase } from 'src/configs/dbConnect'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'

export default async function handler(req, res) {
  const client = await connectToDatabase()

  // -------------------- Token --------------------------------------------------

  const token = await getToken({ req })
  const myUser = await client.db().collection('users').findOne({ email: token.email })
  if (!myUser || !myUser.permissions || !myUser.permissions.includes('ViewPayroll')) {
    return  res.status(401).json({ success: false, message: ['Not Auth'] })
  }

  const company = await client
    .db()
    .collection('companies')
    .findOne({ _id: ObjectId(myUser.company_id) })

  const working_days = company.working_days

  const selectedEmployee = req.body.data
  const id = selectedEmployee._id
  
  // let fromDate = new Date(new Date(selectedEmployee.fromDate).setUTCHours(0,0,0,0)) 
  // let toDate = new Date(new Date(selectedEmployee.toDate).setUTCHours(23,59,59,999))
  
  let fromDate  = new Date(new Date(selectedEmployee.fromDate ).setUTCHours(23,59,59,999) + 1 );
  let toDate =  new Date(new Date(selectedEmployee.toDate ).setUTCHours(23,59,59,999)+1) ;
  console.log(fromDate , toDate); 
  
  // fromDate = new Date( fromDate - 1000 * 60 * 60 * 24  );
  // toDate = new Date( toDate - 1000 * 60 * 60 * 24  );
  

  // --------------------- Get ------------------------------------------

  let employee = await client
    .db()
    .collection('employees')
    .aggregate([
      {
        $match: {
          $and: [{ _id: ObjectId(id) }, { company_id: myUser.company_id }]
        }
      },
      {
        $lookup: {
          from: 'salaryFormula',
          let: { salary_formula_id: { $toString: '$salary_formula_id' } },
          pipeline: [
            { $addFields: { formula_id: { $toObjectId: '$_id' } } },
            { $match: { $expr: { $eq: ['$formula_id', { $toObjectId: '$$salary_formula_id' }] } } },
            { $match: { $or: [ {deleted_at: {$exists: false } } , {deleted_at: null }]  }},
          ],
          as: 'salaryFormulas_info'
        }
      },
      {
        $lookup: {
          from: 'employeePositions',
          let: { employee_id: { $toString: '$_id' } },
          pipeline: [{ 
            $match:  { 
              $and:[ 
                {$expr: { $eq: ['$employee_id', '$$employee_id'] } },
                {$or:[ {deleted_at : null } ,  {deleted_at : {$exists: false}} ]  }
              ]
            }},
            { $match: { $or: [ {deleted_at: {$exists: false } } , {deleted_at: null }]  }},],
            
          as: 'employeePositions_info'
        }
      },
      {
        $lookup: {
          from: 'employeeSalaries',
          let: { employee_id: { $toString: '$_id' } },
          pipeline: [
            { $match: { $or: [ {deleted_at: {$exists: false } } , {deleted_at: null }]  }},
            { $match: {$and:[{ $expr: { $eq: ['$employee_id', '$$employee_id'] } }]} },
            { $sort: { created_at: -1 } }
          ],
          as: 'salaries_info'
        }
      },
      {
        $lookup: {
          from: 'shifts',
          let: { shift_id: { $toObjectId: '$shift_id' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$shift_id'] } } },
          { $match: { $or: [ {deleted_at: {$exists: false } } , {deleted_at: null }]  }},],
          as: 'shift_info'
        }
      },
      {
        $lookup: {
          from: 'attendances',
          let: { employee_no: { $toString: '$idNo' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$employee_no', '$$employee_no'] } } },
            {
              $match: { date: { $gte: new Date( fromDate ).toISOString(), $lte: new Date( toDate ).toISOString() } }
            },
            {
              $match:{ $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] },

            },
            { $match: { $expr: { $eq: ['$status', 'active'] } } },
            { $match: { $or: [ {deleted_at: {$exists: false } } , {deleted_at: null }]  }},
          ],
          as: 'attendances_info'
        }
      },
      {
        $lookup: {
          from: 'compensations',
          let: { compensations: '$compensations' },
          pipeline: [
            { $addFields: { string_id: { $toString: '$_id' } } },
            {
              $match: {
                $expr: {
                  $and: [{ $isArray: '$$compensations' }, { $in: ['$string_id', '$$compensations'] }],
                  
                },
                $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] 
              }
            }
          ],
          as: 'compensations_array'
        }
      },
      {
        $lookup: {
          from: 'employeeLeaves',
          let: { employee_id: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$employee_id', '$$employee_id'] } } },
            {
              $match: {
                $or:[
                  {date_from: { $gte:  new Date( fromDate ).toISOString() , $lte: new Date( toDate  ).toISOString() }},
                  {date_to :  { $gte: new Date(fromDate).toISOString() , $lte: new Date(toDate).toISOString() } }

                ]
                
              }
            },
            {
              $match:{
                $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] 
              }
            }
          ],
          as: 'leaves_info'
        }
      },
      {
        $lookup: {
          from: 'employeeLeaves',
          let: { id: { $toString: '$_id' } },
          pipeline: [
            { 
              $match:  { 
              $and: [
                {
                  $or:[
                    {date_from: { $gte: new Date("1/1/"+new Date().getFullYear()).toISOString() , $lt: new Date("1/1/"+(new Date().getFullYear()+1)).toISOString()  }},
                    {date_to: { $gte: new Date("1/1/"+new Date().getFullYear()).toISOString() , $lt: new Date("1/1/"+(new Date().getFullYear()+1)).toISOString()  }},  
                  ]
                },
                { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] },
                { $expr: { $eq: ['$employee_id', '$$id'] } }
              ]
              }
            }
          ],
          as: 'all_leaves_info' // for the curernt year only
        }
      },
      {
        $lookup: {
          from: 'deductions',
          let: { deductions: '$deductions' },
          pipeline: [
            { $addFields: { string_id: { $toString: '$_id' } } },
            { $match: { $expr: { $and: [{ $isArray: '$$deductions' }, { $in: ['$string_id', '$$deductions'] }] } } },
            { $match: { $or: [ {deleted_at: {$exists: false } } , {deleted_at: null }]  }},
          ],
          as: 'deductions_array'
        }
      },
      {
        $lookup: {
          from: 'employeeDeductions',
          let: { employee_id: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$employee_id', '$$employee_id'] } } },

            { $match: { date: { $gte: (fromDate) , $lte: (toDate)  } } }, // this working without toISOString
            { $match: { $or: [ {deleted_at: {$exists: false } } , {deleted_at: null }]  }},
          ],
          as: 'employee_deductions_info'
        }
      },
      {
        $lookup: {
          from: 'employeeRewards',
          let: { employee_id: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$employee_id', '$$employee_id'] } } },
            { $match: { date: { $gte: ( fromDate) , $lte: ( toDate )  } } }, // this working without toISOString
            { $match: { $or: [ {deleted_at: {$exists: false } } , {deleted_at: null }]  }},
          ],
          as: 'employee_rewards_info'
        }
      },
      {
        $sort: {
          created_at: -1
        }
      }
    ])
    .toArray()
  if(!employee || !employee[0] ){
    return res.status(404).json({success: false, message : ['No employee with this ID']});
  }
  employee = employee[0] ; 

  

  let lumpySalary = 0;
  employee.totalWorkingDaysCount = Math.ceil(Math.abs(new Date(fromDate) - new Date(toDate)) / ( 1000 * 60 * 60 * 24  ));
  if(employee && employee.salaryFormulas_info && employee.salaryFormulas_info[0]  && employee.salaryFormulas_info[0].type == 'Flexible'){
    employee.flexible = true ;
    lumpySalary = Number(req.body.data.lumpySalary) ;
    employee.salaries_info = [ { lumpySalary: lumpySalary } ] ;
  }
  else if(employee && employee.salaries_info && employee.salaries_info[0] && employee.salaries_info[0].lumpySalary){
    lumpySalary = employee.salaries_info[0].lumpySalary;
  }
  lumpySalary= Number(lumpySalary);
  employee.dailySalary =Number(lumpySalary / 30) ;

  //   -------------------------- Assume Compensations -----------------------------------------
  employee.totalSalary = lumpySalary ;
  if (employee.compensations_array) {
          let totalCompensations = 0
          console.log('b' , employee.compensations_array);
          employee.compensations_array.map(comp => {
            let totalValue = 0
            comp.fixedValue = Number(comp.fixedValue);
            comp.percentageValue = Number(comp.percentageValue);
            employee.totalWorkingDaysCount = Number(employee.totalWorkingDaysCount)
            
            if (comp.type == 'Monthly') {
              // totalValue = totalValue + Number(comp.fixedValue) *  Math.ceil((employee.totalWorkingDaysCount/ 30))
              totalValue = totalValue + Number(comp.fixedValue) * 1
              totalValue = totalValue + Number((comp.percentageValue * lumpySalary ) / 100) * 1
            }
            if (comp.type == 'Daily') {
              totalValue = totalValue + Number(comp.fixedValue * employee.totalWorkingDaysCount)
              totalValue = totalValue + Number((comp.percentageValue * employee.totalWorkingDaysCount * employee.dailySalary) / 100)
            }
            comp.totalValue = Number(totalValue)
            totalCompensations = totalCompensations + totalValue
          })
          employee.totalCompensations = totalCompensations
  }
  employee.totalSalary += employee.totalCompensations;
  
        //   -------------------------- Assume Deduction ----------------------------------------------
  
  if (employee.deductions_array) {
          let totalDeductions = 0
          employee.deductions_array.map(deduction => {
            let totalValue = 0
            deduction.fixedValue = Number(deduction.fixedValue);
            deduction.percentageValue = Number(deduction.percentageValue);
            employee.totalWorkingDaysCount = Number(employee.totalWorkingDaysCount)
            if (deduction.type == 'Monthly') {
              // totalValue = totalValue + Number(deduction.fixedValue) * Math.ceil((employee.totalWorkingDaysCount/ 30));
              totalValue = totalValue + Number(deduction.fixedValue) * 1;
              totalValue = totalValue + Number((deduction.percentageValue * lumpySalary) / 100) * Math.ceil((employee.totalWorkingDaysCount/ 30))
            }
            if (deduction.type == 'Daily') {
              totalValue = totalValue + Number(deduction.fixedValue * employee.totalWorkingDaysCount)
              totalValue =
                totalValue +
                Number((deduction.percentageValue * employee.totalWorkingDaysCount * employee.dailySalary) / 100)
            }
            deduction.totalValue = totalValue
            totalDeductions = totalDeductions + totalValue
          })
  
          employee.totalDeductions = totalDeductions
  }                                                       
  employee.totalSalary -= employee.totalDeductions                                                                              ;

  //   -------------------------- Assume Employee Deduction -------------------------------------
  let totalEmployeeDeductions = 0
  if (employee.employee_deductions_info) {
            employee.employee_deductions_info.map(deduction => {
              totalEmployeeDeductions = totalEmployeeDeductions +  Number(deduction.value)
            })
            employee.totalEmployeeDeductions = totalEmployeeDeductions
          }
  
  //   -------------------------- Assume Employee Rewards ----------------------------------------
  
  if (employee.employee_rewards_info) {
            let totalEmployeeRewards = 0
            employee.employee_rewards_info.map(reward => {
              totalEmployeeRewards = totalEmployeeRewards + Number(reward.value)
            })
            employee.totalEmployeeRewards = totalEmployeeRewards
  }

  /// -------------------------- Validation ----------------------------------------------------
  // console.log(employee.totalEmployeeDeductions , employee.totalEmployeeRewards , employee.totalCompensations , employee.totalDeductions , lumpySalary);
  employee.absenseDays =0  ;
  if(employee.flexible){
    return res.status(200).json({success: true , data : [employee] }) ;
  }
  
  // this here because of flexible
  if(!employee.salaryFormulas_info || ! employee.salaryFormulas_info[0]|| !employee?.shift_info || !employee?.shift_info[0] || (!employee?.salaryFormulas_info?.[0]?.type != 'Flexible' && (!employee.salaries_info || employee.salaries_info.length == 0)) || ((!company?.working_days || company?.working_days?.length == 0 ) )){
    let message = [] ;
    if(!employee.salaryFormulas_info || ! employee.salaryFormulas_info?.[0]){
      message.push('Error: define Sarlary Formula for this employee first');
    }
    console.log(employee?.shift_info,!employee?.shift_info);
    if(!employee?.shift_info || !employee?.shift_info?.[0] ){
      message.push('Error: define Shift info for this employee first');
    }
    
    if(!employee?.salaryFormulas_info?.[0]?.type != 'Flexible' && (!employee.salaries_info || employee.salaries_info.length == 0)){
      message.push('Error: Add salary first (no salary defined)!');
    }
    if(!company?.working_days || company?.working_days?.length == 0 ){
      message.push('Error: define working days for your company');
    }
    
    return res.status(400).json({success: false, message: message }); 
  }
 

  let start = new Date(fromDate)
  let end = toDate
  let attendances = []
  let index = 0
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  let holidays = [] ;
  if(company.holidays){
    holidays = company.holidays.map(day => {
      let holidayDate = new Date(day.date).toLocaleDateString().split('/');

      return holidayDate[0] + '/' + holidayDate[1] ;      
    })
  }
  employee.absenseDays = 0;
  let totalWorkingDaysCount =0 ;
  console.log(start , end ); 
  if (employee)
    for (let x = start; x <= end; ) {
      
      index++
      let _in = null 
      let _out = null 
      let earlyFlag = false // It represents lateness when working in the morning
      let lateFlag = false // It represents lateness when working in the evening
      let earlyOvertimeFlag = false ; // It represents overtime when working before work in the morning
      let lateOvertimeFlag = false ;// It represents overtime when working after work in the evening
      let totalHours = 0
      let earlyHours = 0
      let lateHours = 0
      let earlyOverTimeHours = 0
      let lateOverTimeHours = 0
      let day = ''
      let holidayDay = false
      let leaveDay = false
      let leaveHourly = false
      let leavePaidValue = 0
      let leaves = []
      day = new Date(x).getDay() // index 
      let workingDay = working_days.includes(weekday[day]) // boolean
      let dateFormate = new Date(x).toLocaleDateString()
      if(company?.holidays){
        let isHoliday = dateFormate.split('/');

        holidayDay = holidays.includes(isHoliday[0] + '/' + isHoliday[1]) // boolean
      }
 

      // ----------------------- leaves ------------------------------------
      let totalLeaveHours = 0 ; 
      if(employee?.leaves_info){ // each day we may have more than one leave 
        employee.leaves_info?.map(leave => {
            
            var dateFrom = new Date(leave.date_from).setUTCHours(0,0,0,0) ;
            var dateTo = new Date(leave.date_to).setUTCHours(0,0,0,0) ;
            var dateCheck = x.setUTCHours(0,0,0,0) ;
            if ( dateCheck >= dateFrom && dateCheck <= dateTo) {
              if (leave.type == 'daily') {
                leaveDay = true
              }
              if (leave.type == 'hourly') {
                leaveHourly = true
                totalLeaveHours += (Math.abs(dateTo - dateFrom) / 3600000).toFixed(2)
              }
              leaves.push(leave) 
            }
            
          return new Date(day.date).toLocaleDateString()
        })
      }
  
      // -----------------------------------------------------------------
      // console.log(employee) ;
   
 
      const setUTCHours = (time)=>{
        let date = new Date('1/1/2023');
        date.setUTCHours(Number(time.split(':')[0]) ,  Number(time.split(':')[1]) );
        date = new Date(date);

        return date ;
      }
 
      let shift_in = setUTCHours(employee.shift_info[0].times[0].timeIn.toString() ) ; 
      let shift_out =  setUTCHours( employee.shift_info[0].times[0].timeOut.toString()  )
      let availableEarly =  setUTCHours( employee.shift_info[0].times[0].availableEarly.toString()  )// the amount of delay that doesn't count (in the morning)
      let availableLate =  setUTCHours( employee.shift_info[0].times[0].availableLate.toString()  )// the amount of delay that doesn't count (in the afternoon)
      let shiftOverTime1 =  setUTCHours( employee.shift_info[0].times[0]['1st'].toString()  )
      let shiftOverTime2 =  setUTCHours( employee.shift_info[0].times[0]['2nd'].toString()  )
      let shiftOverTime3 =  setUTCHours( employee.shift_info[0].times[0]['3rd'].toString()  )

      // ----------------------- Absence days -----------------------------------------

      if (!leaveDay && !holidayDay && workingDay) {
        lateFlag = true // initlizing it to true (assuming employee didn't attend ) then check if he did....
        lateHours = ((shift_out - shift_in) / 3600000) 
      }


      // -------------------------------------------------------------
      
      if(employee?.attendances_info){
        if(!leaveDay){
            employee.attendances_info?.map(att => {
              if (new Date(x).toLocaleDateString() == new Date(att.date).toLocaleDateString() ) {
                
                _in = setUTCHours( att.timeIn.toString() ) ;
                _out = setUTCHours( att.timeOut.toString() ) ;
                
                earlyFlag = false
                earlyHours =0
                lateFlag = false
                lateHours = 0

                
                totalHours = (
                  ( Math.min(shift_out , _out ) -  Math.max(shift_in , _in )) / 3600000
                )
                
                // ---------------- late ---------------------
                if(!holidayDay && workingDay) // in holidays & off days lateness doesn't count
                  if (_in > availableEarly) {
                    lateFlag = true
                    lateHours = (Math.abs(_in - shift_in) / 3600000).toFixed(2)
                  }
                if(!holidayDay && workingDay) // in holidays & off days lateness doesn't count
                  if (_out < availableLate) {
                    earlyFlag = true
                    earlyHours = (Math.abs(shift_out - _out ) / 3600000).toFixed(2)
                  }
      
                // -------------------- overtime -----------------------
                if(workingDay)
                {  
                  if (_in < shift_in) {
                    earlyOvertimeFlag = true
                    earlyOverTimeHours = ((shift_in - _in ) / 3600000).toFixed(2)
                  }
                  if (_out  > shift_out) {
                    lateOvertimeFlag = true
                    lateOverTimeHours = ((_out - shift_out) / 3600000).toFixed(2)
                  }
                }
                else{
                  if(_in < shift_in ){
                    earlyOvertimeFlag = true ;
                    if(holidayDay){
                      earlyOverTimeHours = (((shift_in - _in) / 3600000).toFixed(2) * employee.salaryFormulas_info[0].holidayOverTime ).toFixed(2);
                    }
                    else if(!workingDay){ // off day ( weekend )
                      earlyOverTimeHours = (((shift_in - _in) / 3600000).toFixed(2) * employee.salaryFormulas_info[0].weekendOverTime).toFixed(2) ;
                    }

                  }
                }
                _in = _in.toISOString().substr(11,8)
                _out = _out.toISOString().substr(11,8)

              }
              
            })
          }
        }

      // في حال كان يوم دوام وهو مداوم (يحسب يوم دوام )
      // يوم دوام وهو مو مداوم (لا يحسب )
      // في حال كان يوم عطلة أو يوم إجازة رسمية يحسب بغض النظر عن الدوام
       
      if((workingDay && _in ) || holidayDay || !workingDay)
        totalWorkingDaysCount++ ;
      if(workingDay && !_in && !leaveDay){
        employee.absenseDays++ ;
      }
      attendances.push({
        day: weekday[day],
        workingDay: workingDay,
        id: index,
        date: new Date(x),
        _in: _in ,
        _out: _out,
        lateFlag: lateFlag,
        earlyFlag: earlyFlag,
        earlyOvertimeFlag: earlyOvertimeFlag,
        lateOverTimeHours: lateOverTimeHours,
        lateHours: lateHours,
        earlyHours: earlyHours,
        totalHours: totalHours,
        earlyOverTimeHours: earlyOverTimeHours,
        lateOverTimeHours: lateOverTimeHours,
        holidayDay: holidayDay,
        leaveDay: leaveDay,
        leaveHourly: leaveHourly,
        leaves:leaves,
        totalLeaveHours: totalLeaveHours
      })
      x = new Date(x.getTime() + 1000 * 60 * 60 * 24 ) ;
    }

    //   ----------------------- Assume hourly Salary -------------------------------
    employee.dailySalary = (employee.salaries_info[0].lumpySalary / 30) //  Daily Salary
    employee.hourlySalary = ( // ok
    employee.dailySalary /
    (
      (new Date('1/1/2023 ' + employee.shift_info[0].times[0].timeOut.toString() + ' UTC') -
        new Date('1/1/2023 ' + employee.shift_info[0].times[0].timeIn.toString() + ' UTC')) /
      3600000
    )
  )
  let totalEarlyOverTimeHours = 0 // overtime hours (morning)
  let totalLateOverTimeHours = 0// overtime hours (evening)

  //   ------------------------ Assume Early & Late OverTime Hours -------------------------------
  
  attendances.map(att => { 
    totalEarlyOverTimeHours = totalEarlyOverTimeHours + Number(att.earlyOverTimeHours)
    totalLateOverTimeHours = totalLateOverTimeHours + Number(att.lateOverTimeHours)
  })

  employee.totalEarlyOverTimeHours = totalEarlyOverTimeHours
  employee.totalLateOverTimeHours = totalLateOverTimeHours

  employee.totalEarlyOverTimeValue = (
    +totalEarlyOverTimeHours *
    +employee.hourlySalary *
    +employee.salaryFormulas_info[0].firstOverTime
  )

  employee.totalLateOverTimeValue = (
    +totalLateOverTimeHours *
    +employee.hourlySalary *
    +employee.salaryFormulas_info[0].firstOverTime
  )

  
  let totalholidayHours = 0
  let totalEarlyHours = 0 // lateness hours (morning)
  let totalLateHours = 0 // lateness hours (evening)
  let totalOffDayHours =0 ; // days that company are not working in.

  //   ----------------------- Assume Early & Late Hours -------------------------------
  attendances.map(att => {
    
    totalEarlyHours = totalEarlyHours + Number(att.earlyHours)
    totalLateHours = totalLateHours + Number(att.lateHours)
    if (att.holidayDay) {
      totalholidayHours = totalholidayHours + +Number(att.totalHours)
    }
    if (!att.holidayDay && !att.workingDay) { // ???????????? 
      totalOffDayHours = totalOffDayHours + Number(att.totalHours)
    }
  })
  employee.totalWorkingDaysCount = totalWorkingDaysCount
  employee.totalholidayHours = totalholidayHours

  employee.totalholidayValue = (
          +totalholidayHours *
          +employee.hourlySalary *
          +employee.salaryFormulas_info[0].holidayOverTime
  )

  employee.totalOffDayHours = totalOffDayHours
  employee.totalOffDayValue = (
          +totalOffDayHours *
          +employee.hourlySalary *
          +employee.salaryFormulas_info[0].weekendOverTime
  )
  employee.totalEarlyHours = totalEarlyHours
  employee.totalLateHours = totalLateHours
  employee.totalEarlyValue =
      (Number(employee.totalEarlyHours + employee.totalLateHours) *
      Number(employee.salaryFormulas_info[0].notJustifiedAbsenceHoure) * // those hours are not justified because justified hours (are in leaves)
      Number(employee.hourlySalary) *
      -1)
  


        //   --------------------------- Assume Leaves -------------------------------------------------

          if (employee.leaves_info) {
            let totalLeave = 0 ;// this value will be subtracted from total salary
            let shift_out = new Date('1/1/2023 ' + employee.shift_info[0].times[0].timeOut.toString() + ' UTC')
            let shift_in = new Date('1/1/2023 ' + employee.shift_info[0].times[0].timeIn.toString() + ' UTC')

            employee.leaves_info.map(leave => {
              let from =  new Date(leave.date_from).setUTCHours(0,0,0,0)
              let to =  new Date(leave.date_to).setUTCHours(0,0,0,0)
              if(leave.type == "daily")
              {

                let days = ((to-from)/ (1000 * 60 * 60 * 24))+1
                let cur = new Date(leave.date_from + ' UTC') ;
                let intersectedDays = 0 ;
                for(let i = 0 ;i < days;i++){
                  
                  if(cur >= fromDate && cur <= toDate ){
                    intersectedDays++ ;
                  }
                  cur = new Date(cur.getTime() + 1000 * 60 * 60 * 24 ) ;
                }
                
                leave.time = (((shift_out - shift_in)*intersectedDays) / 3600000) 
                leave.days = intersectedDays
                totalLeave = totalLeave + Number(((intersectedDays*employee.dailySalary * (100 -leave.paidValue))/100) ) 
                
              }
              if(leave.type == "hourly")
              {
                let cur = new Date(leave.date_from).setUTCHours(0,0,0,0) ; 
                if(cur >= fromDate && cur <= toDate){
                  leave.time = ((new Date(leave.date_to) - new Date(leave.date_from)) / 3600000)
                  totalLeave = totalLeave + Number((((leave.time*employee.hourlySalary) * (100 - leave.paidValue))/100) ) 
                  
                }
              }
            })

            employee.totalLeave = (totalLeave)
        }





  employee = [employee];

return res.status(200).json({ success: true, data: employee, attendances: attendances })
}
